import User from "../../../entities/User";
import {
	UpdateMyProfileMutationArgs,
	UpdateMyProfileResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Mutation: {
		UpdateMyProfile: privateResolver(
			async (
				_,
				args: UpdateMyProfileMutationArgs,
				{ req },
			): Promise<UpdateMyProfileResponse> => {
				const user: User = req.user;
				// User.update 함수에서 두번째 인자로 { ...args } 를 업데이트로 넘기면 type 에러가 난다.
				// null 인 type 들은 User Scheme 에서 충돌하기 때문이다. User type 들은 null 이 없는 필수 type 들로 지정되어 있기 때문
				// 이를 위해 null 로 들어오는 인자들을 걸러내는 과정이 필요하다.
				const notNull = {};
				Object.keys(args).forEach(key => {
					if (args[key] !== null) {
						notNull[key] = args[key];
					}
				});

				try {
					await User.update({ id: user.id }, { ...notNull });
					return {
						ok: true,
						error: null,
					};
				} catch (error) {
					return {
						ok: false,
						error: error.message,
					};
				}
			},
		),
	},
};

export default resolvers;
