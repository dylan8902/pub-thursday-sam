import { APIGatewayProxyEvent, Handler } from "aws-lambda";
import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
} from "@aws-sdk/client-location";
import { v4 as uuidv4 } from "uuid";

interface ApiResponse {
  statusCode: 200 | 400;
  body: string;
}

interface ApiError {
  message: string;
  status?: string;
  stack?: string;
}

const locationClient = new LocationClient({});

const invalidChannelKey = (event: APIGatewayProxyEvent) => {
  if (
    event.headers["Ifttt-Channel-Key"] ===
    "1gxVYXOTug47HlEvKSQbdro-48usKFImioLtXTtNqda03DdTR8AcOf3T9_akd4Pu"
  ) {
    return false;
  } else {
    return {
      statusCode: 401,
      body: JSON.stringify({ errors: [{ message: "Invalid channel key" }] }),
    };
  }
};

export const testSetupHandler: Handler = async (
  event: APIGatewayProxyEvent
) => {
  console.info("received:", event);

  const invalid = invalidChannelKey(event);
  if (invalid) {
    return invalid;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      data: {
        samples: {
          actions: {
            check_in: {
              latitude: "1.0",
              longitude: "1.0",
              name: "Test",
              address: "Test",
            },
          },
          actionRecordSkipping: {
            check_in: {
              latitude: "",
              longitude: "",
              name: "",
              address: "",
            },
          },
        },
      },
    }),
  };
};

export const statusHandler: Handler = async (event: APIGatewayProxyEvent) => {
  console.info("received:", event);

  const invalid = invalidChannelKey(event);
  if (invalid) {
    return invalid;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(event),
  };
};

export const checkInHandler: Handler = async (event: APIGatewayProxyEvent) => {
  console.info("received:", event);

  const invalid = invalidChannelKey(event);
  if (invalid) {
    return invalid;
  }

  const errors: ApiError[] = [];
  let response: ApiResponse;

  try {
    const { address, latitude, longitude, name } = JSON.parse(
      event.body
    ).actionFields;

    if (name === undefined || name === "") {
      errors.push({ message: "Missing name", status: "SKIP" });
    }

    if (
      (address === undefined || address === "") &&
      (latitude === undefined ||
        latitude === "" ||
        longitude === undefined ||
        longitude === "")
    ) {
      errors.push({
        message: "Missing address or location and latitude",
        status: "SKIP",
      });
    }

    if (address) {
      const command = new SearchPlaceIndexForTextCommand({
        IndexName: "explore.place",
        Text: address,
        MaxResults: 1,
      });

      const location = await locationClient.send(command);
      console.info("location:", location);
    }

    response = {
      statusCode: 200,
      body: JSON.stringify({
        data: [{ id: uuidv4() }],
      }),
    };
  } catch (error) {
    errors.push({ message: error.message, stack: error.stack });
  }

  if (errors.length > 0) {
    response = {
      statusCode: 400,
      body: JSON.stringify({
        errors: errors,
      }),
    };
  }

  return response;
};

export const catchAllHandler: Handler = async (event: APIGatewayProxyEvent) => {
  console.info("received:", event);

  return {
    statusCode: 404,
    body: JSON.stringify({ errors: [{ message: "Not found." }] }),
  };
};
