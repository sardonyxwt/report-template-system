import {
  createParser,
  type EventSourceMessage,
  type ParseError,
} from 'eventsource-parser';

export type EventStreamEvent = {
  type?: string;
  data: unknown;
};

/**
 * Reads a finite Server-Sent Events response.
 * Runtime response validation belongs to the server-side endpoint contract.
 */
export const readEventStream = async function* <
  Event extends EventStreamEvent = EventStreamEvent,
>(response: Response): AsyncGenerator<Event> {
  if (!response.body) {
    throw new Error('The event stream is unavailable.');
  }

  const messages: EventSourceMessage[] = [];
  const parser = createParser({
    onEvent: (event) => messages.push(event),
    onError: (error: ParseError) => {
      throw error;
    },
  });
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let complete = false;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        parser.reset({ consume: true });
        complete = true;
      } else {
        parser.feed(value);
      }

      for (const message of messages.splice(0)) {
        try {
          yield {
            type: message.event,
            data: JSON.parse(message.data),
          } as Event;
        } catch {
          throw new Error('The event stream returned invalid JSON.');
        }
      }

      if (done) {
        break;
      }
    }
  } finally {
    if (!complete) {
      await reader.cancel().catch(() => undefined);
    }
    reader.releaseLock();
  }
};
