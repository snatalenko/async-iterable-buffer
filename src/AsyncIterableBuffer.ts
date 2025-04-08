export class AsyncIterableBuffer<T> implements AsyncIterableIterator<T, void> {

	#dataBuffer: T[] = [];
	#pendingRequestResolverQueue: Array<(result: IteratorYieldResult<T> | IteratorReturnResult<any>) => void> = [];
	#closed = false;

	get closed() {
		return this.#closed;
	}

	get length() {
		return this.#dataBuffer.length;
	}

	/**
	 * Push a new value into the buffer. Throws an error if the buffer has been ended.
	 */
	push(value: T) {
		if (this.#closed)
			throw new Error('Iterable buffer is already closed');

		if (this.#pendingRequestResolverQueue.length) {
			const resolve = this.#pendingRequestResolverQueue.splice(0, 1)[0];
			resolve({ done: false, value });
		}
		else {
			this.#dataBuffer.push(value);
		}
	}

	/**
	 * Mark the buffer as completed and resolve any pending requests with { done: true }.
	 */
	end() {
		this.#closed = true;
		while (this.#pendingRequestResolverQueue.length) {
			const resolve = this.#pendingRequestResolverQueue.splice(0, 1)[0];
			resolve({ done: true, value: undefined });
		}
	}

	/**
	 * Returns a promise that resolves to the next buffered value.
	 * If the buffer is empty but not ended, it waits until a value is pushed.
	 */
	async next(): Promise<IteratorYieldResult<T> | IteratorReturnResult<void>> {
		if (this.#dataBuffer.length) {
			const value = this.#dataBuffer.splice(0, 1)[0];
			return { done: false, value };
		}

		if (this.#closed)
			return { done: true, value: undefined };

		return new Promise(resolve => {
			this.#pendingRequestResolverQueue.push(resolve);
		});
	}

	/**
	 * Ends the buffer and returns a result indicating that the iterator is done.
	 * This is useful for early termination of iteration.
	 */
	async return(): Promise<IteratorReturnResult<void>> {
		this.end();
		return { done: true, value: undefined };
	}

	[Symbol.asyncIterator]() {
		return this;
	}
}
