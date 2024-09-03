import { forwardRef, Module } from '@nestjs/common';
import { EventService } from './service/event.service';
import { EventController } from './controller/event.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schema/event.schema';
import { Ticket, TicketSchema } from './schema/ticket.schema';
import { Purchase, PurchaseSchema } from './schema/purchase.schema';
import { UserModule } from 'src/user/user.module';
import { TicketController } from './controller/ticket.controller';
import { PurchaseController } from './controller/purchase.controller';
import { PurchaseService } from './service/purchase.service';
import { PurchaseItem, PurchaseItemSchema } from './schema/purchase-item.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Event.name, schema: EventSchema },
            { name: Ticket.name, schema: TicketSchema },
            { name: Purchase.name, schema: PurchaseSchema },
            { name: PurchaseItem.name, schema: PurchaseItemSchema}
        ]),
        forwardRef(()=> UserModule)
    ],
    controllers: [EventController, TicketController, PurchaseController],
    providers: [EventService, PurchaseService],
    exports: [PurchaseService]
})
export class EventModule { }
