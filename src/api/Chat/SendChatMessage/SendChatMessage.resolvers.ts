import Chat from "../../../entities/Chat";
import Message from "../../../entities/Message";
import User from "../../../entities/User";
import {
	SendChatMessageMutationArgs,
	SendChatMessageResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Mutation: {
		SendChatMessage: privateResolver(
			async (
				_,
				args: SendChatMessageMutationArgs,
				{ req, pubSub },
			): Promise<SendChatMessageResponse> => {
				const user: User = req.user;
				try {
					// 채팅방이 없을 때 메세지를 보낼 수 없도록 먼저 검사
					const chat = await Chat.findOne({ id: args.chatId });
					if (chat) {
						// 그리고 사용자가 해당 채팅방에 속해있는지 확인
						if (chat.passengerId === user.id || chat.driverId === user.id) {
							const message = await Message.create({
								text: args.text,
								chat,
								user,
							}).save();
							pubSub.publish("newChatMessage", {
								MessageSubscription: message,
							});
							return {
								ok: true,
								error: null,
								message,
							};
						} else {
							return {
								ok: false,
								error: "인증되지 않은 사용자 입니다.",
								message: null,
							};
						}
					} else {
						return {
							ok: false,
							error: "채팅방을 찾을 수 없습니다.",
							message: null,
						};
					}
				} catch (error) {
					return {
						ok: false,
						error: error.message,
						message: null,
					};
				}
			},
		),
	},
};

export default resolvers;
