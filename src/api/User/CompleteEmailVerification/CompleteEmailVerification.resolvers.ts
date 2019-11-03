import User from "../../../entities/User";
import Verification from "../../../entities/Verification";
import {
	CompleteEmailVerificationMutationArgs,
	CompleteEmailVerificationResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Mutation: {
		CompleteEmailVerification: privateResolver(
			async (
				_,
				args: CompleteEmailVerificationMutationArgs,
				{ req },
			): Promise<CompleteEmailVerificationResponse> => {
				const user: User = req.user;
				const { key } = args;
				// 사용자의 이메일은 있지만 인증이 완료되지 않은 경우
				if (user.email) {
					try {
						// 이메일과 key 로 사용자를 찾는다.
						const verification = await Verification.findOne({
							key,
							payload: user.email,
						});
						if (verification) {
							// User.verifiedEmail Entity 에 변경
							user.verifiedEmail = true;
							user.save(); // DB 저장
							return {
								ok: true,
								error: null,
							};
						} else {
							return {
								ok: false,
								error: "이메일을 확인할 수 없습니다.",
							};
						}
					} catch (error) {
						return {
							ok: false,
							error: error.message,
						};
					}
				} else {
					return {
						ok: false,
						error: "인증할 이메일이 없습니다.",
					};
				}
			},
		),
	},
};

export default resolvers;
