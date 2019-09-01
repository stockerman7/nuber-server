import { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { fileLoader, mergeResolvers, mergeTypes } from "merge-graphql-schemas";
import path from "path"; // nodejs에 자동으로 딸려오는 모듈

const allTypes: GraphQLSchema[] = fileLoader(
	// api 폴더안에(어떤 sub 폴더든) graphql 파일들 모두 가져오기, 여기서 '*' 는 '어떤 것이든' 이라는 뜻
	path.join(__dirname, "./api/**/*.graphql"),
);

const allResolvers: any = fileLoader(
	// ts 확장자를 안쓴이유는 나중에 js로 변환될 때 충돌을 피할 수 있다. 모든 파일들은 '배열'로 담긴다.
	path.join(__dirname, "./api/**/*.resolvers.*"),
);

// 모든 type, resolver 들을 하나로 합친다. 이것은 상호간의 연결을 신경쓰지 않도록 해준다.
const mergedTypes: any = mergeTypes(allTypes);
const mergedResolvers: any = mergeResolvers(allResolvers);

// makeExecutableSchema 는 모든 schema 들을 하나로 합친다. 그리고 graphql 에 동작하게 해준다.
const schema = makeExecutableSchema({
	typeDefs: mergedTypes,
	resolvers: mergedResolvers,
});

export default schema;
