import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { USER_GENDERS } from '../user.constants.js';

@Schema({ _id: false })
export class UserName {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;
}

const UserNameSchema = SchemaFactory.createForClass(UserName);

@Schema({ _id: false })
export class UserMobile {
  @Prop({ required: true, trim: true })
  primary!: string;

  @Prop({ trim: true })
  alternate?: string;
}

const UserMobileSchema = SchemaFactory.createForClass(UserMobile);

@Schema({ _id: false })
export class UserAddress {
  @Prop({ required: true, trim: true })
  building!: string;

  @Prop({ required: true, trim: true })
  streetAddress!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ required: true, trim: true })
  state!: string;

  @Prop({ required: true, trim: true })
  postalCode!: string;

  @Prop({ required: true, trim: true })
  country!: string;
}

const UserAddressSchema = SchemaFactory.createForClass(UserAddress);

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ type: UserNameSchema, required: true })
  name!: UserName;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username!: string;

  @Prop({ required: true, type: Date })
  dob!: Date;

  @Prop({ required: true, enum: USER_GENDERS })
  gender!: string;

  @Prop({ type: UserMobileSchema, required: true })
  mobile!: UserMobile;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: UserAddressSchema, required: true })
  address!: UserAddress;

  @Prop({ type: String, default: null, trim: true })
  profileImage!: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ 'mobile.primary': 1 }, { unique: true });
