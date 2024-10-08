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
import { TicketController } from './controller/ticket.controller';
import { PurchaseController } from './controller/purchase.controller';

describe("Event Controller", () => {
    let eventController: EventController;
    let ticketController: TicketController;
    let purchaseController: PurchaseController;

    let eventService: EventService;
    let userService: UserService;
    let purchaseService: PurchaseService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EventController, TicketController, PurchaseController],
            providers: [
                EventService, PurchaseService,
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
                    useValue: {
                        findOneByTicketId: jest.fn(),
                        findTicketById: jest.fn(),
                        findHistoryByUserId: jest.fn(),
                        findPurchaseByUserId: jest.fn(),
                        createEmptyPurchase: jest.fn(),
                        findExistingPurchaseItems: jest.fn(),
                        createPurchaseItem: jest.fn(),
                        calculateTotalPrice: jest.fn()
                    }, // Mock PurchaseService if necessary
                },
                {
                    provide: EventService,
                    useValue: {
                        filterEvents: jest.fn(), // Mock the filterEvents method,
                        findAll: jest.fn(),
                        createEvent: jest.fn(),
                        eventDetail: jest.fn(),
                        findById: jest.fn(),
                        findByIdAndUpdate: jest.fn(),

                        // ticket service
                        createTicket: jest.fn(),
                        findTicketById: jest.fn(),
                        updateTicket: jest.fn(),
                        deleteTicket: jest.fn()
                    },
                }

            ],
        }).compile();

        eventController = module.get<EventController>(EventController);
        ticketController = module.get<TicketController>(TicketController);
        purchaseController = module.get<PurchaseController>(PurchaseController);

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

    describe("updateEvent", () => {
        it("should throw an error on event update if the event was not found.", async () => {
            const mockEventUpdate: any = {
                name: "Event",
                date: "2029-09-08",
                time: "10:12 AM",
                venue: "Myanmar"
            }
            const eventId = "1";
            const mockRequest = {
                user: { _id: '1' },
            } as any;

            jest.spyOn(eventService, "findById").mockResolvedValue(null);

            await expect(eventController.updateEvent(eventId, mockRequest, mockEventUpdate)).rejects.toThrow(
                new InternalServerErrorException("Event not found.")
            );
            expect(eventService.findById).toHaveBeenCalledWith(eventId);
        })

        it('should update the event successfully', async () => {
            const eventId = 'event123';
            const userId = 'user123';
            const body: any = {
                // Populate with necessary properties
                name: "event",
                date: "2029-09-09",
                time: "10:09 PM",
                venue: "Yangon"
            };

            const req: any = {
                user: { _id: userId },
            } as any;

            const mockEvent: any = {
                _id: eventId,
                user_id: userId,
                // other event properties
            };

            const mockUpdatedEvent: any = {
                ...mockEvent,
                ...body,
            };

            jest.spyOn(eventService, 'findById').mockResolvedValue(mockEvent);
            jest.spyOn(eventService, 'findByIdAndUpdate').mockResolvedValue(mockUpdatedEvent);

            const result = await eventController.updateEvent(eventId, req, body);

            expect(eventService.findById).toHaveBeenCalledWith(eventId);
            expect(eventService.findByIdAndUpdate).toHaveBeenCalledWith(eventId, body);
            expect(result).toEqual({
                message: 'Event has been updated.',
                data: mockUpdatedEvent,
            });
        });

        it("should throw an error if the user is not the owner of the event", async () => {
            const eventId = 'event123';
            const userId = 'user123';
            const body: any = {
                // Populate with necessary properties
                name: "event",
                date: "2029-09-09",
                time: "10:09 PM",
                venue: "Yangon"
            };

            const req: any = {
                user: { _id: userId },
            } as any;

            const mockEvent: any = {
                _id: eventId,
                user_id: "user1234",
                // other event properties
            };

            jest.spyOn(eventService, 'findById').mockResolvedValue(mockEvent);

            await expect(eventController.updateEvent(eventId, req, body)).rejects.toThrow(
                new InternalServerErrorException('Event not found.'),
            );

            expect(eventService.findById).toHaveBeenCalledWith(eventId);
            expect(eventService.findByIdAndUpdate).not.toHaveBeenCalled();
        })
    })

    describe("Ticket Controller", () => {
        it("should throw an error if event not found", async () => {
            const mockTicket: any = {
                event_id: "event123",
                category: "VIP",
                price: 1000,
                available_ticket: 20
            }
            const req = {
                user: { _id: '1' },
            } as any;

            jest.spyOn(eventService, "findById").mockResolvedValue(null);
            await expect(ticketController.addTicket(req, mockTicket)).rejects.toThrow(
                new InternalServerErrorException("You are not allowed to create ticket.")
            );
            expect(eventService.findById).toHaveBeenCalledWith(mockTicket.event_id);
        })

        it("should throw an error if the user is not the owner of the event", async () => {
            const mockTicket: any = {
                event_id: "event123",
                category: "VIP",
                price: 1000,
                available_ticket: 20
            }
            const req = {
                user: { _id: '1' },
            } as any;

            const mockEvent: any = {
                event_id: "event123",
                user_id: "2"
            }

            jest.spyOn(eventService, "findById").mockResolvedValue(mockEvent);

            await expect(ticketController.addTicket(req, mockTicket)).rejects.toThrow(
                new InternalServerErrorException("You are not allowed to create ticket.")
            )
            expect(eventService.findById).toHaveBeenCalledWith(mockTicket.event_id);
        })

        it("should create an ticket", async () => {
            const body: any = {
                event_id: "event123",
                category: "VIP",
                price: 1000,
                available_ticket: 20
            }
            const req = {
                user: { _id: '1' },
            } as any;

            const mockEvent: any = {
                event_id: "event123",
                user_id: "1"
            }

            const mockTicket: any = {
                ...body
            }

            jest.spyOn(eventService, "findById").mockResolvedValue(mockEvent);
            jest.spyOn(eventService, "createTicket").mockResolvedValue(mockTicket);

            const result = await ticketController.addTicket(req, body);

            expect(eventService.createTicket).toHaveBeenCalledWith(body);
            expect(result).toEqual({
                data: body
            })

        })

        describe("Update Ticket", () => {
            it("should throw an error if ticket not found.", async () => {
                const ticket_id = "ticket123";
                const user_id = "user123";
                const body: any = {
                    event_id: "event123",
                    category: "VIP",
                    price: 1000,
                    available_ticket: 20
                }
                const req: any = {
                    user: { _id: user_id },
                } as any;

                jest.spyOn(eventService, "findTicketById").mockResolvedValue(null);
                await expect(ticketController.updateTicket(ticket_id, req, body)).rejects.toThrow(
                    new InternalServerErrorException("Ticket not found.")
                )
            })

            it("should throw an error if user doesn't own the ticket", async () => {
                const ticket_id = "ticket123";
                const user_id = "user123";
                const body: any = {
                    event_id: "event123",
                    category: "VIP",
                    price: 1000,
                    available_ticket: 20
                }
                const req: any = {
                    user: { _id: user_id },
                } as any;

                const mockTicket: any = {
                    event_id: {
                        user_id: {
                            _id: "user12345678"
                        }
                    }
                }
                jest.spyOn(eventService, "findTicketById").mockResolvedValue(mockTicket);

                await expect(ticketController.updateTicket(ticket_id, req, body)).rejects.toThrow(
                    new InternalServerErrorException('Ticket not found.'),
                );

                expect(eventService.findTicketById).toHaveBeenCalledWith(ticket_id);
            });

            it("should update ticket", async () => {
                const ticket_id = "ticket123";
                const user_id = "user123";
                const body: any = {
                    event_id: "event123",
                    category: "VIP",
                    price: 1000,
                    available_ticket: 20
                }
                const req: any = {
                    user: { _id: user_id },
                } as any;

                const mockTicket: any = {
                    event_id: {
                        user_id: {
                            _id: user_id
                        }
                    }
                }
                const mockUpdatedTicket: any = {
                    ...body,
                    price: 2000
                }

                jest.spyOn(eventService, "findTicketById").mockResolvedValue(mockTicket);
                jest.spyOn(eventService, "updateTicket").mockResolvedValue(mockUpdatedTicket);

                const result = await ticketController.updateTicket(ticket_id, req, body);

                expect(eventService.findTicketById).toHaveBeenCalledWith(ticket_id);
                expect(eventService.updateTicket).toHaveBeenCalledWith(ticket_id, body);
                expect(result).toEqual({
                    message: "Ticket has been updated.",
                    data: mockUpdatedTicket
                })
            })
        });

        describe("Delete Ticket", () => {
            it("should throw an error if ticket has been purchased by users.", async () => {
                const ticket_id = "ticket123";
                const req: any = {
                    user: {
                        _id: "user123"
                    }
                };

                jest.spyOn(eventService, "findTicketById").mockResolvedValue({} as any);
                jest.spyOn(purchaseService, "findOneByTicketId").mockResolvedValue({} as any);

                await expect(ticketController.deleteTicket(ticket_id, req)).rejects.toThrow(
                    new InternalServerErrorException("Cannot delete ticket as it has been purchased by users.")
                );
                expect(eventService.findTicketById).toHaveBeenCalledWith(ticket_id);
                expect(purchaseService.findOneByTicketId).toHaveBeenCalledWith(ticket_id);
            })

            it("should throw an error if ticket not found.", async () => {
                const ticket_id = "ticket123";
                const req: any = {
                    user: {
                        _id: "user123"
                    }
                };

                jest.spyOn(eventService, "findTicketById").mockResolvedValue(null);
                jest.spyOn(purchaseService, "findOneByTicketId").mockResolvedValue(null);

                await expect(ticketController.deleteTicket(ticket_id, req)).rejects.toThrow(
                    new InternalServerErrorException("Ticket not found.")
                );
                expect(eventService.findTicketById).toHaveBeenCalledWith(ticket_id);
                expect(purchaseService.findOneByTicketId).toHaveBeenCalledWith(ticket_id);
            })

            it("should throw an error if user doesn't own the ticket", async () => {
                const ticket_id = "ticket123";
                const req: any = {
                    user: {
                        _id: "user123"
                    }
                };
                const mockTicket: any = {
                    event_id: {
                        user_id: { _id: "user1234567" }
                    }
                }

                jest.spyOn(eventService, "findTicketById").mockResolvedValue(mockTicket);
                jest.spyOn(purchaseService, "findOneByTicketId").mockResolvedValue(null);

                await expect(ticketController.deleteTicket(ticket_id, req)).rejects.toThrow(
                    new InternalServerErrorException("Ticket not found.")
                );
                expect(eventService.findTicketById).toHaveBeenCalledWith(ticket_id);
                expect(purchaseService.findOneByTicketId).toHaveBeenCalledWith(ticket_id);
            })

            it("should delete ticket", async () => {
                const ticket_id = "ticket123";
                const req: any = {
                    user: {
                        _id: "user123"
                    }
                };
                const mockTicket: any = {
                    event_id: {
                        user_id: { _id: "user123" }
                    }
                }

                jest.spyOn(eventService, "findTicketById").mockResolvedValue(mockTicket);
                jest.spyOn(purchaseService, "findOneByTicketId").mockResolvedValue(null);
                jest.spyOn(eventService, "deleteTicket").mockResolvedValue(null);

                const result = await ticketController.deleteTicket(ticket_id, req);

                expect(eventService.findTicketById).toHaveBeenCalledWith(ticket_id);
                expect(purchaseService.findOneByTicketId).toHaveBeenCalledWith(ticket_id);
                expect(eventService.deleteTicket).toHaveBeenCalledWith(ticket_id);
                expect(result).toEqual({
                    message: "Ticket has been deleted."
                })
            })
        });
    });

    describe("Purchase Controller", () => {
        it("should return purchase history", async () => {
            const query = { page: "1", limit: "20" };
            const user_id = "user123"
            const req = {
                user: { _id: user_id }
            } as any;

            const mockHistory = [
                {
                    _id: '66d6cf1ac4e8a50c0ead7877',
                    user_id: '66d6cf1ac4e8a50c0ead7875',
                    purchase_items: [
                        {
                            _id: '66d6d034c4e8a50c0ead78a1',
                            ticket_id: '66d6cfa2c4e8a50c0ead7888',
                            user_id: '66d6cf1ac4e8a50c0ead7875',
                            quantity: 5,
                            unit_price: 10000,
                            total_price: 50000,
                            purchase_date: '2024-09-03T09:00:36.709Z',
                            createdAt: '2024-09-03T09:00:36.710Z',
                            updatedAt: '2024-09-03T09:00:36.710Z',
                            __v: 0,
                        },
                    ],
                    total_price: 200000,
                    createdAt: '2024-09-03T08:55:54.127Z',
                    updatedAt: '2024-09-03T09:01:16.701Z',
                    __v: 4,
                },
            ];

            jest.spyOn(userService, "findById").mockResolvedValue({} as any);
            jest.spyOn(purchaseService, "findHistoryByUserId").mockResolvedValue(mockHistory as any);

            const result = await purchaseController.purchaseHistory(req, query);

            expect(userService.findById).toHaveBeenCalledWith(user_id);
            expect(purchaseService.findHistoryByUserId).toHaveBeenCalledWith(user_id, +query.page, +query.limit);
            expect(result).toEqual({
                data: mockHistory
            })

        })

        it("should throw an error if user account not found", async () => {
            const query = { page: "1", limit: "20" };
            const user_id = "user123"
            const req = {
                user: { _id: user_id }
            } as any;

            jest.spyOn(userService, "findById").mockResolvedValue(null);

            await expect(purchaseController.purchaseHistory(req, query)).rejects.toThrow(
                new InternalServerErrorException("Account not found.")
            )
            expect(userService.findById).toHaveBeenCalledWith(user_id);
        })
    })

    describe("Purchase Ticket", () => {
        it("should throw an error if ticket was not found", async () => {
            const user_id = "user123";
            const req: any = {
                user: { _id: user_id }
            }
            const body = { ticket_id: "ticket123", quantity: 5 };

            jest.spyOn(eventService, "findTicketById").mockResolvedValue(null);

            await expect(purchaseController.addTicketToPurchase(req, body)).rejects.toThrow(
                new InternalServerErrorException("Ticket not found.")
            )

            expect(eventService.findTicketById).toHaveBeenCalledWith(body.ticket_id);
        })

        it("assume has existing purchase item and should throw an error if Not enough ticket available", async () => {
            const user_id = "user123";
            const req: any = {
                user: { _id: user_id }
            }
            const body = { ticket_id: "ticket123", quantity: 50 };
            const mockTicket = {
                _id: "ticket123",
                event_id: {
                    _id: "event123",
                    user_id: {
                        _id: user_id,
                        name: "user name"
                    }
                },
                category: 'VIP',
                price: 10000,
                available_ticket: 10,
            } as any;

            const mockPurchase = {
                _id: "66e7b9f675ab77f3a3a59727",
                user_id: "66d6cf1ac4e8a50c0ead7875",
                purchase_items: ["66e7b9f675ab77f3a3a5972a"],
                total_price: 50000,
            } as any;

            jest.spyOn(eventService, "findTicketById").mockResolvedValue(mockTicket);
            jest.spyOn(purchaseService, "findPurchaseByUserId").mockResolvedValue(mockPurchase);
            jest.spyOn(purchaseService, "findExistingPurchaseItems").mockResolvedValue(null);

            await expect(purchaseController.addTicketToPurchase(req, body)).rejects.toThrow(
                new InternalServerErrorException("Not enough ticket available.")
            )

            expect(eventService.findTicketById).toHaveBeenCalledWith(body.ticket_id);
            expect(purchaseService.findPurchaseByUserId).toHaveBeenCalledWith(user_id);
            expect(purchaseService.findExistingPurchaseItems).toHaveBeenCalledWith(user_id, body.ticket_id);
        })

        it("should ticket add to purchase successfully.", async () => {
            const user_id = "user123";
            const req: any = {
                user: { _id: user_id }
            }
            const body = { ticket_id: "ticket123", quantity: 5 };
            const mockTicket = {
                _id: "ticket123",
                event_id: {
                    _id: "event123",
                    user_id: {
                        _id: user_id,
                        name: "user name"
                    }
                },
                category: 'VIP',
                price: 10000,
                available_ticket: 10,
                save: jest.fn().mockResolvedValue(true)
            } as any;

            const mockPurchase = {
                _id: "66e7b9f675ab77f3a3a59727",
                user_id: user_id,
                purchase_items: [],
                total_price: 0,
                save: jest.fn().mockResolvedValue(true)
            } as any;

            const mockPurchaseItem = {
                ticket_id:  "ticket123",
                user_id: user_id,
                quantity: body.quantity,
                unit_price: 10000,
                total_price: 50000,
                _id: "66e7c266e9338962c886e4f9",
                purchase_date: "2024 -09 - 16T05: 30: 14.368Z",
                __v: 0
            } as any;

            jest.spyOn(eventService, "findTicketById").mockResolvedValue(mockTicket);
            jest.spyOn(purchaseService, "findPurchaseByUserId").mockResolvedValue(mockPurchase);
            jest.spyOn(purchaseService, "findExistingPurchaseItems").mockResolvedValue(null);
            jest.spyOn(purchaseService, "createPurchaseItem").mockResolvedValue(mockPurchaseItem);

            const result = await purchaseController.addTicketToPurchase(req, body);

            expect(result).toEqual({
                success: true, message: "Ticket added to purchase."
            });

            expect(eventService.findTicketById).toHaveBeenCalledWith(body.ticket_id);
            expect(purchaseService.findPurchaseByUserId).toHaveBeenCalledWith(user_id);
            expect(purchaseService.findExistingPurchaseItems).toHaveBeenCalledWith(user_id, body.ticket_id);
            expect(purchaseService.createPurchaseItem).toHaveBeenCalledWith({
                ticket_id: body.ticket_id,
                quantity: body.quantity,
                unit_price: mockTicket.price,
                total_price: mockTicket.price * +body.quantity,
                user_id: user_id
            });
        })
    })

})