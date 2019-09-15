import User from "../../../entities/User";
import {
	FacebookConnectMutationArgs,
	FacebookConnectResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import createJWT from "../../../utils/createJWT";

const resolvers: Resolvers = {
	Mutation: {
		FacebookConnect: async (
			_,
			args: FacebookConnectMutationArgs,
		): Promise<FacebookConnectResponse> => {
			const { fbID } = args;
			try {
				// 먼저 Facebook ID 가 이미 존재하는지 확인
				const existingUser = await User.findOne({ fbID });
				// 이미 로그인한 사용자가 있다면
				if (existingUser) {
					const token = createJWT(existingUser.id);
					return {
						ok: true,
						error: null,
						token,
					};
				}
			} catch (error) {
				return {
					ok: false,
					error: error.message,
					token: null,
				};
			}
			// 새로운 사용자, try/catch 구문은 에러를 캐치하고 보기쉽게 메세지를 전달한다.
			try {
				// 새로운 사용자를 생성하고 데이터베이스 저장/업데이트
				const newUser = await User.create({
					...args,
					profilePhoto: `http://graph.facebook.com/${fbID}/picture?type=square`,
				}).save();
				const token = createJWT(newUser.id);
				return {
					ok: true,
					error: null,
					token,
				};
			} catch (error) {
				return {
					ok: false,
					error: error.message,
					token: null,
				};
			}
		},
	},
};

export default resolvers;
