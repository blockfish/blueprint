import { combine } from '../utils'
import { Queue } from '../model/queue'

export const QueueEntry = React.memo(({
    className: cls,
    queue,
    onChange,
}) => (
    <div className={combine('queue-entry', cls)}>
        <button disabled={!onChange} onClick={() => showQueuePrompt(queue, onChange)}>
            {`Q: ${queue}`}
        </button>
    </div>
));

function showQueuePrompt(prevQueue, callback) {
    let queue = undefined;
    try {
        let str = window.prompt('Enter queue:', prevQueue.toString());
        if (str !== null) {
            queue = Queue.parse(str);
        }
    } catch (e) {
        alert(`${e}`);
    }
    if (queue && callback) {
        callback(queue);
    }
}
