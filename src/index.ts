import { Options } from "graphql-yoga";
import app from "./app";

const PORT: number | string =  process.env.PORT || 4000;
const PLAYGORUND_ENDPOINT: string = "/playground";
const GRAPHQL_ENDPOINT: string = "/graphql";

// Options 타입에 cmd + 마우스를 올리면 타입 설정 방법이 나온다.
// 주의: @types/node, @types/cors etc... 설치를 우선 해야한다.
const appOptions : Options = {
  port: PORT,
  playground: PLAYGORUND_ENDPOINT,
  endpoint: GRAPHQL_ENDPOINT
};

const handleAppStart = () => console.log(`Listening on port ${PORT}`);

app.start(appOptions, handleAppStart);