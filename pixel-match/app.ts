import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jpeg from 'jpeg-js';
import fetch from 'node-fetch';
import pixelmatch from 'pixelmatch';

const errorResponse = (message: string) => {
    const response: APIGatewayProxyResult = {
        statusCode: 500,
        body: JSON.stringify({
            message,
        }),
    };
    return response;
};

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        return errorResponse('body is null.');
    }
    const requestBody = JSON.parse(event.body) as { imageUrl1: string; imageUrl2: string };
    console.dir(`requestBody${requestBody}`);
    console.log(`imageUrl1: ${requestBody.imageUrl1}`);
    console.log(`imageUrl2: ${requestBody.imageUrl2}`);

    if (requestBody.imageUrl1 === undefined || requestBody.imageUrl2 === undefined) {
        return errorResponse('not exist parameters imageUrl1 or imageUrl2.');
    }

    try {
        const res1 = await fetch(requestBody.imageUrl1);
        const res2 = await fetch(requestBody.imageUrl2);
        const arrayBuffer1 = await res1.arrayBuffer();
        const arrayBuffer2 = await res2.arrayBuffer();
        const rawImageData1 = jpeg.decode(arrayBuffer1);
        const rawImageData2 = jpeg.decode(arrayBuffer2);
        const width = rawImageData1.width;
        const height = rawImageData1.height;

        const mismatchedPixels = pixelmatch(rawImageData1.data, rawImageData2.data, null, width, height, {
            threshold: 0.1,
        });
        const matchPercent = Math.floor((1 - mismatchedPixels / (width * height)) * 100);

        const response: APIGatewayProxyResult = {
            statusCode: 200,
            body: JSON.stringify({
                matchPercent,
            }),
        };
        return response;
    } catch (err: unknown) {
        console.error(err);
        return errorResponse(err instanceof Error ? err.message : 'some error happened');
    }
};
