import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventController } from './controller/event.controller';
import { UserService } from '../user/user.service';
import { EventService } from './service/event.service';
import { PurchaseService } from './service/purchase.service';
import { Event } from './schema/event.schema';
import { Ticket } from './schema/ticket.schema';
import { Purchase } from './schema/purchase.schema';
import { PurchaseItem } from './schema/purchase-item.schema';
import { InternalServerErrorException } from '@nestjs/common';

describe("Event Controller", () => {
    let eventController: EventController;
    let eventService: EventService;
    let userService: UserService;
    let purchaseService: PurchaseService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EventController],
            providers: [
                EventService,
                {
                    provide: getModelToken(Event.name),
                    useValue: jest.fn(),
                },
                {
                    provide: getModelToken(Ticket.name), // Add the Ticket model mock
                    useValue: jest.fn(),
                },
                {
                    provide: getModelToken(Purchase.name), // Add the Ticket model mock
                    useValue: jest.fn(),
                },
                {
                    provide: getModelToken(PurchaseItem.name), // Add the Ticket model mock
                    useValue: jest.fn(),
                },
                {
                    provide: UserService,
                    useValue: {
                        findById: jest.fn()
                    }, // Mock UserService if necessary
                },
                {
                    provide: PurchaseService,
                    useValue: {}, // Mock PurchaseService if necessary
                },
                {
                    provide: EventService,
                    useValue: {
                        filterEvents: jest.fn(), // Mock the filterEvents method,
                        findAll: jest.fn(),
                        createEvent: jest.fn(),
                        eventDetail: jest.fn()
                    },
                }

            ],
        }).compile();

        eventController = module.get<EventController>(EventController);
        eventService = module.get<EventService>(EventService);
        userService = module.get<UserService>(UserService);
        purchaseService = module.get<PurchaseService>(PurchaseService);
    });

    it("should return paginated events data", async () => {
        const mockEvents = [{ id: "1", name: "event 1" }, { id: "2", name: "event 2" }] as any;
        const mockTotal = 2;

        jest.spyOn(eventService, "findAll").mockResolvedValue({
            events: mockEvents,
            total_count: mockTotal
        });

        const query = { page: "1", limit: "20" };
        const result = await eventController.getAllEvent(query);

        expect(eventService.findAll).toHaveBeenCalledWith(1, 20);
        expect(result).toEqual({
            data: {
                events: mockEvents,
                page: 1,
                limit: 20,
                total_count: mockTotal
            }
        });

    })

    it('should use default pagination if query params are not provided', async () => {
        const mockEvents = [
            { _id: '1', id: 1, name: 'Event 1' },
            { _id: '2', id: 2, name: 'Event 2' }
        ] as any;

        const mockTotalCount = 2;

        // Mocking the findAll method of the EventService
        jest.spyOn(eventService, 'findAll').mockResolvedValue({
            events: mockEvents,
            total_count: mockTotalCount,
        });

        const query = {};
        const result = await eventController.getAllEvent(query as any);

        expect(result).toEqual({
            data: {
                events: mockEvents,
                page: 1,
                limit: 20,
                total_count: mockTotalCount,
            },
        });
        expect(eventService.findAll).toHaveBeenCalledWith(1, 20);
    });

    it('should return empty arrays when the search query is empty', async () => {
        const query = { page: '1', limit: '20', q: '' };
        const result = await eventController.filterEventByName(query);

        expect(result).toEqual({
            data: {
                events: [],
                page: 1,
                limit: 20,
                total_count: 0,
            },
        });
        expect(eventService.filterEvents).not.toHaveBeenCalled(); // Ensure service method was not called
    });


    it('should return filtered events when the search query is provided', async () => {
        const mockEvents = [
            { id: 1, name: 'Event 1' },
            { id: 2, name: 'Event 2' },
        ];
        const mockTotalCount = 2;
        const query = { page: '1', limit: '20', q: 'Event' };

        // Mocking the filterEvents method to return the mock data
        jest.spyOn(eventService, 'filterEvents').mockResolvedValue({
            events: mockEvents,
            total_count: mockTotalCount,
        });

        const result = await eventController.filterEventByName(query);

        expect(eventService.filterEvents).toHaveBeenCalledWith('Event', 1, 20);
        expect(result).toEqual({
            data: {
                events: mockEvents,
                page: 1,
                limit: 20,
                total_count: mockTotalCount,
            },
        });

    });

    it("should create an event", async () => {
        const mockEventCreate: any = {
            name: "Event",
            date: "2029-09-08",
            time: "10:12 AM",
            venue: "Myanmar"
        }
        const mockRequest: any = {
            user: { _id: '1' },
        };

        jest.spyOn(userService, "findById").mockResolvedValue({} as any);
        jest.spyOn(eventService, "createEvent").mockResolvedValue(mockEventCreate);

        const event = await eventController.createEvent(mockEventCreate, mockRequest);

        expect(userService.findById).toHaveBeenCalledWith(mockRequest.user._id);
        expect(eventService.createEvent).toHaveBeenCalledWith(mockEventCreate, mockRequest.user._id);
        expect(event).toEqual({
            message: "Event has been created.",
            data: mockEventCreate
        });

    })

    it("should throw an error in event creation if user account not found", async () => {
        const mockEventCreate: any = {
            name: "Event",
            date: "2029-09-08",
            time: "10:12 AM",
            venue: "Myanmar"
        }
        const mockRequest = {
            user: { _id: '1' },
        } as any;

        jest.spyOn(userService, "findById").mockResolvedValue(null);

        await expect(eventController.createEvent(mockEventCreate, mockRequest)).rejects.toThrow(
            new InternalServerErrorException("Account not found."),
        );
    })

    it("should return event detail if event was found.", async () => {
        const mockEvent = { _id: "1", name: "Event" } as any;
        const eventId = "1";

        jest.spyOn(eventService, "eventDetail").mockResolvedValue(mockEvent);

        const result = await eventController.eventDetail(eventId);

        expect(eventService.eventDetail).toHaveBeenCalledWith(eventId);
        expect(result).toEqual({ data: mockEvent });
    })

    it("should throw an error if event not found.", async () => {
        const mockEvent = { _id: "1", name: "Event" } as any;
        const eventId = "1";

        jest.spyOn(eventService, "eventDetail").mockResolvedValue(null);


        await expect(eventController.eventDetail(eventId)).rejects.toThrow(
            new InternalServerErrorException("Event not found."),
        );
        expect(eventService.eventDetail).toHaveBeenCalledWith(eventId);

    })

})