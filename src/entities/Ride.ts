import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { rideStatus } from "../types/types";
import Chat from "./Chat";
import User from "./User";

@Entity()
class Ride extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	@Column({
		type: "text",
		enum: ["ACCEPTED", "FINISHED", "CANCELED", "REQUESTING", "ONROUTE"],
		default: "REQUESTING",
	})
	status: rideStatus;

	@Column({ type: "text" })
	pickUpAddress: string;

	@Column({ type: "double precision", default: 0 })
	pickUpLat: number;

	@Column({ type: "double precision", default: 0 })
	pickUpLng: number;

	@Column({ type: "text" })
	dropOffAddress: string;

	@Column({ type: "double precision", default: 0 })
	dropOffLat: number;

	@Column({ type: "double precision", default: 0 })
	dropOffLng: number;

	@Column({ type: "double precision", default: 0 })
	price: number;

	@Column({ type: "text" })
	distance: string;

	@Column({ type: "text" })
	duration: string;

	@Column({ nullable: true })
	passengerId: number;

	// 다수의 Ride(승객)는 한명의 User(passenger, driver)를 갖는다.
	@ManyToOne(type => User, user => user.ridesAsPassenger)
	passenger: User;

	@Column({ nullable: true })
	driverId: number;

	// Ride 를 요청할 시에는 아직 Driver 가 할당되지 않은 상태기 때문에 nullable 을 설정한다.
	@ManyToOne(type => User, user => user.ridesAsDriver, { nullable: true })
	driver: User;

	@OneToOne(type => Chat, chat => chat.ride, { nullable: true })
	@JoinColumn()
	chat: Chat;

	// 탑승자는 채팅창이 열리면 탑승자를 식별하는 채팅 식별자가 필요하다.
	@Column({ nullable: true })
	chatId: number;

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;
}

export default Ride;
