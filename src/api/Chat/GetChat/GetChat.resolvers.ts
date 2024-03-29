import Chat from "../../../entities/Chat";
import User from "../../../entities/User";
import { GetChatQueryArgs, GetChatResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Query: {
		GetChat: privateResolver(
			async (_, args: GetChatQueryArgs, { req }): Promise<GetChatResponse> => {
				const user: User = req.user;
				try {
					const chat = await Chat.findOne(
						{
							id: args.chatId,
						},
						{ relations: ["driver", "passenger", "messages"] }, // chat 과 driver, passenger 관계 연결
					);
					if (chat) {
						if (chat.passengerId === user.id || chat.driverId === user.id) {
							return {
								ok: true,
								error: null,
								chat,
							};
						} else {
							return {
								ok: false,
								error: "인증되지 않은 채팅방입니다.",
								chat: null,
							};
						}
					} else {
						return {
							ok: false,
							error: "Not found.",
							chat: null,
						};
					}
				} catch (error) {
					return {
						ok: false,
						error: error.message,
						chat: null,
					};
				}
			},
		),
	},
};

export default resolvers;
