import { AsyncIterableBuffer } from '../../src';

describe('AsyncIterableBuffer', () => {

	it('yields pushed values in order', async () => {

		const buffer = new AsyncIterableBuffer<number>();
		buffer.push(1);
		buffer.push(2);
		buffer.push(3);
		buffer.end();

		const results: number[] = [];
		for await (const value of buffer)
			results.push(value);

		expect(results).toEqual([1, 2, 3]);
	});

	it('resolves pending next() when push() is called', async () => {

		const buffer = new AsyncIterableBuffer<string>();
		const nextPromise = buffer.next();
		buffer.push('hello');
		const result = await nextPromise;
		expect(result).toEqual({ done: false, value: 'hello' });
	});

	it('returns done:true when buffer is ended and no items remain', async () => {

		const buffer = new AsyncIterableBuffer<number>();
		buffer.end();
		const result = await buffer.next();
		expect(result).toEqual({ done: true, value: undefined });
	});

	it('throws an error if push() is called after end()', () => {

		const buffer = new AsyncIterableBuffer<number>();
		buffer.end();
		expect(() => buffer.push(1)).toThrow('Iterable buffer is already closed');
	});

	it('[Symbol.asyncIterator]() returns the instance itself', () => {

		const buffer = new AsyncIterableBuffer<number>();
		expect(buffer[Symbol.asyncIterator]()).toBe(buffer);
	});

	it('allows async iteration to wait for new pushes', async () => {

		const buffer = new AsyncIterableBuffer<number>();
		const results: number[] = [];

		// Start async iteration
		(async () => {
			for await (const num of buffer)
				results.push(num);
		})();

		// Wait briefly, then push values.
		await new Promise(resolve => setTimeout(resolve, 5));
		buffer.push(10);
		await new Promise(resolve => setTimeout(resolve, 5));
		buffer.push(20);
		buffer.end();

		// Wait for the iteration to complete.
		await new Promise(resolve => setTimeout(resolve, 5));
		expect(results).toEqual([10, 20]);
	});

	it('flushes pending next() promises when return() is called', async () => {

		const buffer = new AsyncIterableBuffer<number>();
		const nextPromise = buffer.next();
		const ret = await buffer.return();
		expect(ret).toEqual({ done: true, value: undefined });
		const nextResult = await nextPromise;
		expect(nextResult).toEqual({ done: true, value: undefined });
	});

	it('prevents push() after return() is called', async () => {

		const buffer = new AsyncIterableBuffer<number>();
		await buffer.return();
		expect(() => buffer.push(42)).toThrow('Iterable buffer is already closed');
	});

	it('next() returns done:true after return() is called', async () => {

		const buffer = new AsyncIterableBuffer<number>();
		await buffer.return();
		const result = await buffer.next();
		expect(result).toEqual({ done: true, value: undefined });
	});
});
