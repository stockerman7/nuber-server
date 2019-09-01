import { Options } from "graphql-yoga";
import { createConnection } from "typeorm"; // 서버 연동을 위한 orm 생성
import app from "./app";
import connectionOptions from "./ormConfig"; // 서버 orm 설정들, 데이터베이스와 앱 연동을 도와줌

const PORT: number | string = process.env.PORT || 4000;
const PLAYGORUND_ENDPOINT: string = "/playground";
const GRAPHQL_ENDPOINT: string = "/graphql";

// Options 타입에 cmd + 마우스를 올리면 타입 설정 방법이 나온다.
// 주의: @types/node, @types/cors etc... 설치를 우선 해야한다.
const appOptions: Options = {
	port: PORT, // localhost:4000
	playground: PLAYGORUND_ENDPOINT, // graphql 테스트를 위한 endpoint
	endpoint: GRAPHQL_ENDPOINT, // graphql endpoint
};

const handleAppStart = () => console.log(`Listening on port ${PORT}`);

// 서버(데이터베이스) 접속 후 앱 연동
createConnection(connectionOptions).then(() => {
	app.start(appOptions, handleAppStart);
});
