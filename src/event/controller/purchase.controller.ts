import { Body, Controller, Delete, Get, InternalServerErrorException, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { EventService } from '../service/event.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestInterface } from 'src/auth/interface/request.interface';
import { UserService } from 'src/user/user.service';
import { Public } from 'src/auth/decorators/public.decorators';
import { PurchaseService } from '../service/purchase.service';
import mongoose from 'mongoose';

@Controller({ path: "purchase", version: "1" })
@UseGuards(JwtAuthGuard)
export class PurchaseController {
    constructor(
        private readonly eventService: EventService,
        private readonly userService: UserService,
        private readonly purchaseService: PurchaseService
    ) { }

    @Get("/history")
    async purchaseHistory(
        @Request() req: RequestInterface,
        @Query() query: { page: string, limit: string }
    ) {
        const page = +query.page || 1;
        const limit = +query.limit || 20;
        const user_id = req.user._id;
        const user = await this.userService.findById(user_id);

        if (!user) throw new InternalServerErrorException("Account not found.");

        const history = await this.purchaseService.findHistoryByUserId(user_id, page, limit);

        return {
            data: history
        }

    }

    @Post("/add")
    async addTicketToPurchase(
        @Request() req: RequestInterface,
        @Body() body: { ticket_id: string, quantity: number }
    ) {
        const user_id = req.user._id;
        const ticket = await this.eventService.findTicketById(body.ticket_id);

        // Find existing purchase table of user.
        let purchase = await this.purchaseService.findPurchaseByUserId(user_id);

        if (!purchase) {
            purchase = await this.purchaseService.createEmptyPurchase(user_id);
        }

        if (!ticket) {
            throw new InternalServerErrorException("Ticket not found.");
        }

        const existingPurchaseItem = await this.purchaseService.findExistingPurchaseItems(user_id, body.ticket_id);

        if (existingPurchaseItem) {
            // Check if the ticket has enough stock for the additional quantity
            const newQuantity = body.quantity;
            if (newQuantity > ticket.available_ticket) {

                throw new InternalServerErrorException("Not enough ticket available.");
            }

            // Update the existing purchase item
            existingPurchaseItem.quantity += newQuantity;
            existingPurchaseItem.total_price = existingPurchaseItem.unit_price * existingPurchaseItem.quantity;
            await existingPurchaseItem.save();

            // Deduct the difference from the ticket's stock
            ticket.available_ticket -= body.quantity;
            await ticket.save();

        } else {
            if (body.quantity > ticket.available_ticket) {
                throw new InternalServerErrorException("Not enough ticket available.");
            }
            // Create a new purchase item
            const purchaseItem = await this.purchaseService.createPurchaseItem({
                ticket_id: body.ticket_id,
                quantity: +body.quantity,
                unit_price: ticket.price,
                total_price: ticket.price * +body.quantity,
                user_id: user_id
            });

            // Add the purchase item to the purchase
            purchase.purchase_items.push(purchaseItem._id as mongoose.Types.ObjectId);
            await purchase.save();

            // Deduct the quantity from the ticket's stock
            ticket.available_ticket -= body.quantity;
            await ticket.save();
        }

        const grand_total = await this.purchaseService.calculateTotalPrice(user_id);

        purchase.total_price = grand_total;
        await purchase.save();

        return { success: true, message: "Ticket added to purchase." };

    }
}



/**
 * 
 * // Check if the ticket has enough stock for the additional quantity
            const newQuantity = existingPurchaseItem.quantity + body.quantity;
            console.log("new quantity :", newQuantity);
            if (newQuantity > ticket.available_ticket) {
                console.log("run");

                throw new InternalServerErrorException("Not enough ticket available.");
            }

            // Update the existing purchase item
            existingPurchaseItem.quantity = newQuantity;
            existingPurchaseItem.total_price = existingPurchaseItem.unit_price * newQuantity;
            await existingPurchaseItem.save();

            // Deduct the difference from the ticket's stock
            ticket.available_ticket -= body.quantity;
            await ticket.save();



if (existingPurchaseItem.quantity !== body.quantity) {
                // Calculate the difference in quantity
                const quantityDifference = body.quantity - existingPurchaseItem.quantity;

                // Check if the ticket has enough stock for the additional quantity
                if (quantityDifference > 0 && quantityDifference > ticket.available_ticket) {
                    throw new InternalServerErrorException("Not enough tickets available.");
                }

                // Update ticket stock if the quantity has changed
                if (!isNaN(ticket.available_ticket) && !isNaN(quantityDifference)) {
                    ticket.available_ticket -= quantityDifference; // Deduct the difference from the ticket stock
                    await ticket.save(); // Save the updated ticket stock quantity
                }

                // Update existing purchase item
                existingPurchaseItem.quantity = body.quantity;
                existingPurchaseItem.total_price = existingPurchaseItem.unit_price * body.quantity;
                await existingPurchaseItem.save();
            }
 */