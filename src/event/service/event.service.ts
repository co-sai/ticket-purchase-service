import { Injectable, Body } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Event } from '../schema/event.schema';
import mongoose, { Model } from 'mongoose';
import { Ticket } from '../schema/ticket.schema';
import { Purchase } from '../schema/purchase.schema';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { PipelineStage } from 'mongoose';

@Injectable()
export class EventService {
    constructor(
        @InjectModel(Event.name) private eventModel: Model<Event>,
        @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
    ) { }

    async createEvent(body: CreateEventDto, user_id: string) {
        const event = new this.eventModel({
            ...body,
            user_id,
        });
        return event.save();
    }

    async findById(id: string) {
        return await this.eventModel.findById(id).exec();
    }

    async findByIdAndUpdate(id: string, body: UpdateEventDto) {
        const event = await this.eventModel.findByIdAndUpdate(id, body, { new: true }).exec();
        return event;
    }

    async findByIdAndDelete(id: string, user_id: string) {
        return await this.eventModel.findOneAndDelete({
            $and: [
                { _id: id },
                { user_id: user_id }
            ]
        }).exec();
    }

    async findAll(page: number, limit: number) {
        const events = await this.eventModel.find()
            .populate("user_id", "name")
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })
            .exec();

        const total_count = await this.eventModel.find().countDocuments();

        return { events, total_count };
    }

    async eventDetail(id: string) {
        // Define the aggregation pipeline
        const pipeline: PipelineStage[] = [
            // Match events based on the query condition
            { $match: { _id: new mongoose.Types.ObjectId(id) } },

            // Perform the lookup to join with tickets
            {
                $lookup: {
                    from: 'tickets', // The name of the tickets collection
                    localField: '_id',
                    foreignField: 'event_id',
                    as: 'tickets'
                }
            },

            // Optionally, project fields if you want to include/exclude specific fields
            {
                $project: {
                    name: 1,
                    date: 1,
                    time: 1,
                    venue: 1,
                    tickets: 1 // Include tickets in the results
                }
            }
        ];

        // Run the aggregation pipeline
        const event = await this.eventModel.aggregate(pipeline).exec();

        return event;
    }

    async filterEvents(
        q: string,
        page: number = 1,
        limit: number = 20
    ) {
        // Prepare the query condition for filtering events by name
        const queryCondition: any = {};
        if (q) {
            queryCondition.name = { $regex: new RegExp(q.trim(), 'i') };
        }

        // Define the aggregation pipeline
        const pipeline: PipelineStage[] = [
            // Match events based on the query condition
            { $match: queryCondition },

            // Perform the lookup to join with tickets
            {
                $lookup: {
                    from: 'tickets', // The name of the tickets collection
                    localField: '_id',
                    foreignField: 'event_id',
                    as: 'tickets'
                }
            },

            // Optionally, project fields if you want to include/exclude specific fields
            {
                $project: {
                    name: 1,
                    date: 1,
                    time: 1,
                    venue: 1,
                    tickets: 1 // Include tickets in the results
                }
            },

            // Add sorting by created date or any other field
            { $sort: { createdAt: -1 } },

            // Implement pagination
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        // Run the aggregation pipeline
        const events = await this.eventModel.aggregate(pipeline).exec();

        // Get the total count of events matching the query condition
        const total_count = await this.eventModel.countDocuments(queryCondition).exec();

        return { events, total_count };
    }



    /** ticket */
    async createTicket(body: CreateTicketDto) {
        const ticket = new this.ticketModel({
            ...body
        });
        return await ticket.save();
    }

    async findTicketById(id: string) {
        return await this.ticketModel.findById(id)
            .populate({
                path: "event_id",
                select: "_id user_id",
                populate: {
                    path: "user_id",
                    select: "_id name",
                    model: "User"
                }
            })
            .exec();
    }

    async updateTicket(id: string, body: UpdateTicketDto) {
        const ticket = await this.ticketModel.findByIdAndUpdate(id, body, { new: true }).exec();
        return ticket;
    }

    async deleteTicket(id: string) {
        return await this.ticketModel.findByIdAndDelete(id);
    }

    async findTicketsByEventId(event_id: string){
        return await this.ticketModel.find({ event_id }).select("_id");
    }
    /** ticket */

}
