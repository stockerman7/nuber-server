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
				const { user } = req;
				const { key } = args;
				if (user.email) {
					try {
						const verification = await Verification.findOne({
							key,
							payload: user.email,
						});
						if (verification) {
							user.verifiedEmail = true; // User.verifiedEmail Entity 에 변경
							user.save(); // DB 저장
							return {
								ok: true,
								error: null,
							};
						} else {
							return {
								ok: false,
								error: "이메일을 인증할 수 없습니다.",
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
