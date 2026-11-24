import { HttpError } from '../errors/httpError.js';
import { RespostaSubmetidaEvent } from '../dtos/avaliacao.dto.js';
import { QUEUE_RESPOSTAS, getChannel } from './broker.js';

/** Publica o evento na fila durável e aguarda a confirmação do broker. */
export function publicarRespostaSubmetida(evento: RespostaSubmetidaEvent): Promise<void> {
  const ch = getChannel();
  if (!ch) throw new HttpError(503, 'Message broker indisponível.');

  return new Promise((resolve, reject) => {
    ch.sendToQueue(
      QUEUE_RESPOSTAS,
      Buffer.from(JSON.stringify(evento)),
      { persistent: true, contentType: 'application/json' },
      (err) => (err ? reject(new HttpError(503, 'Falha ao publicar no broker.')) : resolve())
    );
  });
}
