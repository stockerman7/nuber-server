import Place from "../../../entities/Place";
import User from "../../../entities/User";
import { EditPlaceMutationArgs, EditPlaceResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import cleanNullArgs from "../../../utils/cleanNullArgs";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Mutation: {
		EditPlace: privateResolver(
			async (
				_,
				args: EditPlaceMutationArgs,
				{ req },
			): Promise<EditPlaceResponse> => {
				const user: User = req.user;
				try {
					// typeorm 은 기본적으로 relations(@ManyToOne, @OneToMany...)을 로드하지 않는다.
					// 그래서 두번째 인자로 옵션을 설정하기 위해 일부분(user)의 관계만 로드한다.
					const place = await Place.findOne({ id: args.placeId });
					if (place) {
            // 사용자 id 로 사용자가 즐겨찾는 장소가 맞는지 여부
						if (place.userId === user.id) {
							const notNull = cleanNullArgs(args);
							await Place.update({ id: args.placeId }, { ...notNull });
						} else {
							return {
								ok: false,
								error: "확인되지 않았습니다.",
							};
						}
						return {
							ok: true,
							error: null,
						};
					} else {
						return {
							ok: false,
							error: "장소를 찾지 못했습니다.",
						};
					}
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
