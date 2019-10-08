// 미들웨어인 cors, helmet, morgan 이 설치 되어야함, yarn add cors helmet morgan
import cors from "cors";
import { NextFunction, Response } from "express";
import { GraphQLServer, PubSub } from "graphql-yoga";
import helmet from "helmet";
import logger from "morgan";
// .graphql 과 resolver.ts 를 모두 합친 schema.ts 를 불러온다.
import schema from "./schema";
import decodeJWT from "./utils/decodeJWT"; // JWT 복호화 모듈 불러오기

class App {
	public app: GraphQLServer;
	public pubSub: any;
	constructor() {
		this.pubSub = new PubSub(); // Publish & Subscription(출판과 구독, graphql-yoga 자체 지원)
		this.pubSub.ee.setMaxListeners(99); // 개발용 listener
		// GraphQL 서버는 src/api 경로 안에 있는 모든 .graphql 타입들과 resolvers.ts 를 알고 있다.
		// 그러나 .graphql 안의 schema 들과 resolvers.ts 안의 resolvers 타입 간의 types check가 되지는 않는다.
		// package.json
		this.app = new GraphQLServer({
			schema,
			// 나중에 요청이 들어올 시 Callback 으로 전달할 Context, 모든 Resolvers 에서 사용가능
			context: req => {
				return {
					req: req.request,
					pubSub: this.pubSub,
				};
			},
		});
		this.middlewares();
	}
	private middlewares = (): void => {
		this.app.express.use(cors());
		this.app.express.use(logger("dev"));
		this.app.express.use(helmet());
		this.app.express.use(this.jwt); // JWT 복호화 Middleware 를 연결한다.
	};

	// Client 로 부터 받은 JWT_TOKEN 을 복호화
	private jwt = async (
		req,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		// 들어온 Token 중에 해당 HTTP Header 가 있는지 조회(Header 이름은 아무거나 상관없다.)
		const token = req.get("X-JWT");
		if (token) {
			const user = await decodeJWT(token);
			if (user) {
				req.user = user;
			} else {
				req.user = undefined;
			}
		}
		next();
	};
}

export default new App().app;
