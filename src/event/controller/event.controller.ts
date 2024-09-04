import { Body, Controller, Delete, Get, HttpCode, InternalServerErrorException, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { EventService } from '../service/event.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateEventDto } from '../dto/create-event.dto';
import { RequestInterface } from 'src/auth/interface/request.interface';
import { UserService } from 'src/user/user.service';
import { UpdateEventDto } from '../dto/update-event.dto';
import { Public } from 'src/auth/decorators/public.decorators';
import * as moment from 'moment';
import { PurchaseService } from '../service/purchase.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Event API')
@Controller({ path: "event", version: "1" })
@UseGuards(JwtAuthGuard)
export class EventController {
    constructor(
        private readonly eventService: EventService,
        private readonly userService: UserService,
        private readonly purchaseService: PurchaseService
    ) { }

    @Public()
    @Get("list")
    @HttpCode(200)
    @ApiOperation({ summary: 'Event List' })
    @ApiResponse({ status: 200 })
    async getAllEvent(
        @Query() query: { page: string; limit: string },
    ) {
        const page = +query.page || 1;
        const limit = +query.limit || 20;

        const { events, total_count } = await this.eventService.findAll(page, limit);

        return {
            data: {
                events,
                page,
                limit,
                total_count
            }
        }
    }

    @Public()
    @Get("/search")
    @HttpCode(200)
    @ApiOperation({ summary: 'Filter Event by "name"' })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Page number for pagination',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Limit the number of results',
    })
    @ApiQuery({
        name: 'q',
        required: false,
        description: 'Search term',
    })
    @ApiResponse({ status: 200 })
    async filterEventByName(
        @Query() query: { page: string, limit: string, q?: string }
    ) {
        const q = query.q ? query.q.trim() : '';

        const page = +query.page || 1;
        const limit = +query.limit || 20;

        // If all search parameters are empty, return empty arrays
        if (!q) {
            return {
                data: {
                    events: [],
                    page,
                    limit,
                    total_count: 0
                },
            };
        }

        const { events, total_count } = await this.eventService.filterEvents(q, page, limit);

        return {
            data: {
                events,
                page,
                limit,
                total_count
            }
        };
    }

    @Post("add")
    @HttpCode(201)
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: 'Event Create' })
    @ApiBody({ type: CreateEventDto })
    @ApiResponse({ status: 201 })
    async createEvent(
        @Body() body: CreateEventDto,
        @Request() req: RequestInterface
    ) {
        const user_id = req.user._id;
        const user = await this.userService.findById(user_id);
        if (!user) {
            throw new InternalServerErrorException("Account not found.");
        }

        const event = await this.eventService.createEvent(body, user_id);

        return {
            message: "Event has been created.",
            data: event
        }
    }

    @Public()
    @Get("/:id")
    @HttpCode(200)
    @ApiOperation({ summary: 'Event Detail' })
    @ApiResponse({ status: 200 })
    async eventDetail(
        @Param("id") id: string
    ) {
        const event = await this.eventService.eventDetail(id);
        if (!event) {
            throw new InternalServerErrorException("Event not found.");
        }
        return {
            data: event
        }
    }

    @Patch("/:id")
    @HttpCode(200)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update Event' })
    @ApiBody({ type: UpdateEventDto })
    @ApiResponse({
        status: 200,
    })
    async updateEvent(
        @Param("id") id: string,
        @Request() req: RequestInterface,
        @Body() body: UpdateEventDto
    ) {
        const user_id = req.user._id;
        const event = await this.eventService.findById(id);

        if (!event || event?.user_id.toString() !== user_id.toString()) {
            throw new InternalServerErrorException("Event not found.");
        }

        const updatedEvent = await this.eventService.findByIdAndUpdate(id, body);

        return {
            message: "Event has been updated.",
            data: updatedEvent
        }
    }

    @Delete("/:id")
    @HttpCode(200)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Delete Event' })
    @ApiResponse({
        status: 200,
    })
    async deleteEvent(
        @Param("id") id: string,
        @Request() req: RequestInterface,
    ) {
        const user_id = req.user._id;
        const event = await this.eventService.findById(id);

        if (!event || event?.user_id.toString() !== user_id.toString()) {
            throw new InternalServerErrorException("Event not found.");
        }

        const tickets = await this.eventService.findTicketsByEventId(id);
        const ticketIds = tickets.map((ticket)=> ticket._id);
        
        const purchaseItems = await this.purchaseService.findByTicketIds(ticketIds);
        if(purchaseItems.length > 0){
            throw new InternalServerErrorException("Cannot delete event with purchased tickets.");
        }
        //  *** have to delete related tickets.
        await this.eventService.findByIdAndDelete(id, user_id);

        return {
            message: "Event has been deleted."
        }
    }
}
