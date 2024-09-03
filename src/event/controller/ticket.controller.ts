import { Body, Controller, Delete, InternalServerErrorException, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { EventService } from '../service/event.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestInterface } from 'src/auth/interface/request.interface';
import { UserService } from 'src/user/user.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { PurchaseService } from '../service/purchase.service';

@Controller({ path: "ticket", version: "1" })
@UseGuards(JwtAuthGuard)
export class TicketController {
    constructor(
        private readonly eventService: EventService,
        private readonly userService: UserService,
        private readonly purchaseService: PurchaseService
    ) { }

    @Post("/add")
    async addTicket(
        @Request() req: RequestInterface,
        @Body() body: CreateTicketDto
    ) {
        const event = await this.eventService.findById(body.event_id);
        if (!event || event?.user_id.toString() !== req.user._id.toString()) {
            throw new InternalServerErrorException("You are not allowed to create ticket.")
        }
        const ticket = await this.eventService.createTicket(body);

        return {
            data: ticket
        }
    }

    @Patch("/:id")
    async updateTicket(
        @Param("id") id: string,
        @Request() req: RequestInterface,
        @Body() body: Partial<UpdateTicketDto>
    ) {
        const ticket: any = await this.eventService.findTicketById(id);

        if (!ticket || ticket?.event_id?.user_id?._id?.toString() !== req.user._id.toString()) {
            throw new InternalServerErrorException("Ticket not found.");
        }

        const updatedTicket = await this.eventService.updateTicket(id, body);

        return {
            message: "Ticket has been updated.",
            data: updatedTicket
        }
    }

    @Delete("/:id")
    async deleteTicket(
        @Param("id") id: string,
        @Request() req: RequestInterface,
    ) {
        const ticket: any = await this.eventService.findTicketById(id);

        // Ticket Deletion with Restrict
        const purchaseItem = await this.purchaseService.findOneByTicketId(id);
        
        if(purchaseItem){
            throw new InternalServerErrorException("Cannot delete ticket as it has been purchased by users.");
        }

        if (!ticket || ticket?.event_id?.user_id?._id?.toString() !== req.user._id.toString()) {
            throw new InternalServerErrorException("Ticket not found.");
        }

        await this.eventService.deleteTicket(id);

        return {
            message: "Ticket has been deleted."
        }
    }
}
