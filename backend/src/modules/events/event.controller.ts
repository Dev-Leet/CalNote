import { Request, Response, NextFunction } from 'express';
import { eventService } from './event.service';

export async function listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = req.query as { from: string; to: string };
    const events = await eventService.getEventsInRange(req.user!.userId, new Date(from), new Date(to));
    res.status(200).json({ events });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body;
    const event = await eventService.createEvent({
      userId: req.user!.userId,
      title: body.title,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      recurrence: body.recurrence,
      force: body.force,
    });
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { EventModel } = await import('../../models/Event.model');
    const { AppError } = await import('../../utils/AppError');

    const event = await EventModel.findById(req.params.id);
    if (!event) throw new AppError('NOT_FOUND', 404, 'Event not found');
    if (event.userId.toString() !== req.user!.userId) throw new AppError('NOT_OWNER', 403, 'You do not own this event');

    const body = req.body;
    if (body.title !== undefined) event.title = body.title;
    if (body.startTime !== undefined) event.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) event.endTime = new Date(body.endTime);
    if (body.recurrence !== undefined) event.recurrence = body.recurrence;

    await event.save();
    res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await eventService.deleteEvent(req.user!.userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
