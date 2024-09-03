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
import { PurchaseItem } from '../schema/purchase-item.schema';

@Injectable()
export class PurchaseService {
    constructor(
        @InjectModel(Event.name) private eventModel: Model<Event>,
        @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
        @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
        @InjectModel(PurchaseItem.name) private purchaseItemModel: Model<PurchaseItem>
    ) { }

    async findPurchaseByUserId(user_id: string) {
        return await this.purchaseModel.findOne({ user_id }).exec();
    }

    async createEmptyPurchase(user_id: string) {
        const purchase = new this.purchaseModel({
            user_id,
            purchase_items: []
        });
        return await purchase.save();
    }

    async findExistingPurchaseItems(user_id: string, ticket_id: string) {
        return await this.purchaseItemModel.findOne({
            user_id, ticket_id
        }).exec();
    }

    async createPurchaseItem(
        body: {
            ticket_id: string,
            quantity: number,
            unit_price: number,
            total_price: number,
            user_id: string
        }
    ) {
        const purchase = new this.purchaseItemModel({
            ...body
        });
        return await purchase.save();
    }

    // Method to update total_price for a purchase
    async calculateTotalPrice(user_id: string) {
        // Find all PurchaseItems related to this purchase
        const purchaseItems = await this.purchaseItemModel.find({ user_id }).exec();
        const totalPrice = purchaseItems.reduce((acc, item) => acc + item.total_price, 0);

        return totalPrice;
    }

    async findOneByTicketId(id: string) {
        return await this.purchaseItemModel.findOne({ ticket_id: id }).exec();
    }

    async findByTicketIds(ids: any){
        return await this.purchaseItemModel.find({ 
            ticket_id: { $in: ids }
        }).exec();
    }

    async findHistoryByUserId(user_id: string, page: number, limit: number){
        return await this.purchaseModel.findOne({
            user_id
        })
        .populate({
            path: 'purchase_items',
            populate: {
                path: '_id',
                select: "_id ticket_id quantity unit_price total_price purchase_date"
            },
        })
        .sort({ createdAt: -1 })
        .exec();

    }
}