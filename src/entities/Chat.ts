import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import Message from "./Message";
import User from "./User";

// 하나의 Chat에서 다수의 메세지, 다수의 사용자를 가지도록 한다.
// 여러개의 Chat에서 다수의 메세지, 다수의 사용자를 가지려면 ManyToOne -> ManyToMany 로 변경
// User.ts 에서 다음과 같이 변경한다.
// @ManyToOne(type => Chat, chat => chat.passenger)
// chatsAsPassenger: Chat[];
@Entity()
class Chat extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	// Chat은 다수의 메세지를 가진다.
	// param1: 대상(target) 타입, param2: 메세지 객체
	@OneToMany(type => Message, message => message.chat)
	messages: Message[];

	@Column({ nullable: true })
	passengerId: number;

	// 다수의 Chat은 하나의 User(Passenger, Driver)를 가진다.
	@ManyToOne(type => User, user => user.chatsAsPassenger)
	passenger: User;

	@Column({ nullable: true })
	driverId: number;

	@ManyToOne(type => User, user => user.chatsAsDriver)
	driver: User;

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;
}

export default Chat;
