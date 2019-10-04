import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import User from "./User";

@Entity()
class Place extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	@Column({ type: "text" })
	name: string;

	@Column({ type: "double precision", default: 0 })
	lat: number;

	@Column({ type: "double precision", default: 0 })
	lng: number;

	@Column({ type: "text" })
	address: string;

	@Column({ type: "boolean", default: false })
	isFav: boolean;

	// typeorm 에서는 간편하게 사용자의 ID 를 식별하는 기능을 지원한다.
	@Column({ nullable: true })
	userId: number;

	@ManyToOne(type => User, user => user.places)
	user: User;

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;
}

export default Place;
