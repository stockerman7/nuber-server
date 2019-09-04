import {
	BaseEntity,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import Message from "./Message";

@Entity()
class Chat extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	// 하나의 Chat 이 다수의 메세지를 가진다.
	// param1: 대상(target) 타입, param2: 메세지 객체
	@OneToMany(type => Message, message => message.chat)
	messages: Message[];

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;
}

export default Chat;
