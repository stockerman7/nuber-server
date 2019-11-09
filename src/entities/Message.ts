import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import Chat from "./Chat";
import User from "./User";

@Entity()
class Message extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	@Column({ type: "text" })
	text: string;

	@Column({ nullable: true })
	chatId: number;

	// 다수의 메세지가 하나의 Chat에 있다.
	@ManyToOne(type => Chat, chat => chat.messages)
	chat: Chat;

	// 수많은 메세지는 한명의 User에게 전달한다.
	@ManyToOne(type => User, user => user.messages)
	user: User;

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;
}

export default Message;
