import dotenv from "dotenv"; // 환경 변수를 로드하는 모듈, yarn add dotenv -> 설치가 되었어야함
dotenv.config(); // 환경변수 설정(src/.env 환경변수 파일 경로를 찾아가 설정), connectionOption 이전에 호출해야 한다. 그렇지 않으면 환경변수가 적용되지 않은 상태에서 orm 이 실행된다. 다시말해 환경변수(.env) 설정을 거쳐서 ormConfig.ts 가 설정된다.

import { Options } from "graphql-yoga";
import { createConnection } from "typeorm"; // 1. DB서버 연동을 위한 orm 생성
import app from "./app";
import connectionOptions from "./ormConfig"; // 2. DB서버 orm 옵션들
import decodeJWT from "./utils/decodeJWT";

const PORT: number | string = process.env.PORT || 4000;
const PLAYGORUND_ENDPOINT: string = "/playground";
const GRAPHQL_ENDPOINT: string = "/graphql";
const SUBSCRIPTION_ENDPOINT: string = "/subscription";

// Options 타입에 cmd + 마우스를 올리면 타입 설정 방법이 나온다.
// 주의: @types/node, @types/cors @types/helmet 설치를 우선 해야한다.
const appOptions: Options = {
	port: PORT, // localhost:4000
	playground: PLAYGORUND_ENDPOINT, // graphql 테스트를 위한 endpoint
	endpoint: GRAPHQL_ENDPOINT, // graphql endpoint
	subscriptions: {
		path: SUBSCRIPTION_ENDPOINT,
		onConnect: async connectionParams => {
			const token = connectionParams["X-JWT"];
			if (token) {
				const user = await decodeJWT(token);
				if (user) {
					return {
						currentUser: user,
					};
				}
			}

			throw new Error("No JWT. 구독이 없습니다.");
		},
	},
};

const handleAppStart = () => console.log(`Listening on port ${PORT}`);

// 3. DB서버 접속 후 앱 연동 설정, catch 로 에러를 잡는다.
createConnection(connectionOptions)
	.then(() => {
		app.start(appOptions, handleAppStart);
	})
	.catch(error => console.log(error));
