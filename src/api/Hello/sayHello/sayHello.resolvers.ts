// "src/types/graph.d.ts" 파일(typescript 화된 graphql query type 정의들을 모아논 곳) 불러온다.
import { SayHelloQueryArgs, SayHelloResponse } from "../../../types/graph";

const resolvers = {
	Query: {
		sayHello: (_, args: SayHelloQueryArgs): SayHelloResponse => {
			return {
				text: `Hello ${args.name}`,
				error: false,
			};
		},
	},
};

export default resolvers;
