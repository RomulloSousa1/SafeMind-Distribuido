import amqp from 'amqplib';
import { respostaSubmetidaEventSchema } from '../dtos/avaliacao.dto.js';
import { respostaService } from '../services/respostaService.js';
import { QUEUE_RESPOSTAS } from './broker.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Point-to-Point: as réplicas competem pela mesma fila; cada evento é tratado uma vez. */
export async function iniciarConsumidor(ch: amqp.ConfirmChannel): Promise<void> {
  await ch.prefetch(10);
  await ch.consume(QUEUE_RESPOSTAS, async (msg) => {
    if (!msg) return;

    let evento;
    try {
      evento = respostaSubmetidaEventSchema.parse(JSON.parse(msg.content.toString()));
    } catch {
      console.error('[Consumer] Mensagem inválida descartada.');
      ch.nack(msg, false, false);
      return;
    }

    try {
      await respostaService.processar(evento);
      ch.ack(msg);
    } catch (err) {
      console.error('[Consumer] Falha ao processar; reenfileirando:', (err as Error).message);
      await sleep(2000);
      ch.nack(msg, false, true);
    }
  });
}
