import { AsyncIterableBuffer } from '../../src';

describe('AsyncIterableBuffer', () => {

	describe('push()', () => {

		it('throws an error if push() is called after end()', () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.end();
			expect(() => buffer.push(1)).toThrow('Iterable buffer is already closed');
		});

		it('throws an error if push() is called after return()', () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.return();
			expect(() => buffer.push(1)).toThrow('Iterable buffer is already closed');
		});

		it('adds a value to the buffer', () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.push(1);
			expect(buffer).toHaveLength(1);
		});

		it('resolves pending next() when push() is called', async () => {

			const buffer = new AsyncIterableBuffer<string>();
			const nextPromise = buffer.next();
			buffer.push('hello');
			const result = await nextPromise;
			expect(result).toEqual({ done: false, value: 'hello' });
		});
	});

	describe('closed', () => {

		it('is false by default', () => {
			const buffer = new AsyncIterableBuffer<number>();
			expect(buffer.closed).toBe(false);
		});

		it('remains false after next() is called', () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.next();
			expect(buffer.closed).toBe(false);
		});

		it('is true after end() is called', () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.end();
			expect(buffer.closed).toBe(true);
		});

		it('is true after return() is called', () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.return();
			expect(buffer.closed).toBe(true);
		});
	});

	describe('length', () => {

		it('is 0 by default', () => {
			const buffer = new AsyncIterableBuffer<number>();
			expect(buffer).toHaveProperty('length', 0);
		});

		it('returns the number of items in the buffer', () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.push(1);
			buffer.push(2);
			expect(buffer).toHaveProperty('length', 2);
		});

		it('decreases when items are consumed', async () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.push(1);
			buffer.push(2);
			buffer.push(3);

			await buffer.next();

			expect(buffer).toHaveProperty('length', 2);

			await buffer.next();

			expect(buffer).toHaveProperty('length', 1);
		});

		it('keeps number of unconsumed items in the buffer after end() is called', async () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.push(1);
			buffer.push(2);
			buffer.push(3);

			await buffer.next();
			buffer.end();

			expect(buffer).toHaveProperty('length', 2);
		});
	});

	describe('next()', () => {

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

		it('returns done:true when buffer is ended and no items remain', async () => {

			const buffer = new AsyncIterableBuffer<number>();
			buffer.end();
			const result = await buffer.next();
			expect(result).toEqual({ done: true, value: undefined });
		});

		it('next() returns done:true after return() is called', async () => {

			const buffer = new AsyncIterableBuffer<number>();
			await buffer.return();
			const result = await buffer.next();
			expect(result).toEqual({ done: true, value: undefined });
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
	});

	describe('end()', () => {

		it('prevents push() after end() is called', () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.end();
			expect(() => buffer.push(42)).toThrow('Iterable buffer is already closed');
		});

		it('allows next() to be called after end()', async () => {
			const buffer = new AsyncIterableBuffer<number>();
			buffer.push(1);
			buffer.push(2);
			buffer.end();

			const result = await buffer.next();
			expect(result).toEqual({ done: false, value: 1 });
			const result2 = await buffer.next();
			expect(result2).toEqual({ done: false, value: 2 });
			const result3 = await buffer.next();
			expect(result3).toEqual({ done: true, value: undefined });
		});

		it('resolves pending next() promises when end() is called', async () => {
			const buffer = new AsyncIterableBuffer<string>();
			const nextPromise = buffer.next();
			const nextPromise2 = buffer.next();
			buffer.push('hello');
			buffer.end();
			const result = await nextPromise;
			expect(result).toEqual({ done: false, value: 'hello' });
			const result2 = await nextPromise2;
			expect(result2).toEqual({ done: true, value: undefined });
		});
	});

	describe('[Symbol.asyncIterator]()', () => {

		it('returns the instance itself', () => {

			const buffer = new AsyncIterableBuffer<number>();
			expect(buffer[Symbol.asyncIterator]()).toBe(buffer);
		});
	});

	describe('return()', () => {

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
	});
});
