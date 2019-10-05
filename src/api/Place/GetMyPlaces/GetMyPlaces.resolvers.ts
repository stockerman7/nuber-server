import User from "../../../entities/User";
import { GetMyPlacesResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Query: {
		GetMyPlaces: privateResolver(
			async (_, __, { req }): Promise<GetMyPlacesResponse> => {
				try {
					const user = await User.findOne(
						{ id: req.user.id }, // # 인자1 찾을 조건: 요청 user.id
						{ relations: ["places"] }, // 인자2 관계 Option: user.places 관계가 있다는 것을 알려준다.
          );
          // 해당 사용자가 있을 경우
					if (user) {
						return {
							ok: true,
							error: null,
							places: user.places
						};
					} else {
						return {
							ok: false,
							error: "사용자를 찾지 못했습니다.",
							places: null,
						};
					}
				} catch (error) {
					return {
						ok: false,
						error: error.message,
						places: null,
					};
				}
			},
		),
	},
};

export default resolvers;
