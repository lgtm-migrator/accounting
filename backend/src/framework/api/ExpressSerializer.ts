export namespace ExpressSerializer {
	/**
	 * Serialize an apiOutput to be JSON compatible
	 * @param apiOutput the output object to serialize
	 * @return serialized object
	 */
	export function serialize(apiOutput: {}): {} {
		const object: any = {}

		for (let [key, value] of Object.entries(apiOutput)) {
			// Convert bigint
			if (typeof value === 'bigint') {
				object[key] = `${value}n`
			}

			// Regexp - Use value directly
			else if (value instanceof RegExp) {
				object[key] = value
			}

			// Recursive object
			else if (typeof value === 'object' && value) {
				const child = serialize(value!)
				if (child) {
					object[key] = child
				}
			}

			// Use value
			else {
				object[key] = value
			}
		}

		return object
	}
}
