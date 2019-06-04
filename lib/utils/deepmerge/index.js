/*
  Credit to Kyle Mathews
  https://github.com/KyleAMathews/deepmerge
*/

import defaultIsMergeableObject from './is-mergeable-object'

function emptyTarget(val) {
	return Array.isArray(val) ? [] : {}
}

function cloneUnlessOtherwiseSpecified(value, options) {
	return (options.clone !== false && options.isMergeableObject(value))
		? deepmerge(emptyTarget(value), value, options)
		: value
}

function concatArrayMerge(target, source, options) {
	return target.concat(source).map(function(element) {
		return cloneUnlessOtherwiseSpecified(element, options)
	})
}

// merges two arrays, by merging entries that share the same _id key, and concatenating 
// all other entries
function arrayMergeById(target, source, options) {
	var idProp = "_id";

	// cloned entries that have no ids
	var resultsWithoutId = [];

	// build hash map for all target entries by id
	var targetById = {};
	for (var i = 0; i < target.length; i++) {
		var targetEntry = target[i];
		var targetEntryId = targetEntry[idProp];
		if (typeof(targetEntryId) !== "undefined") {
			targetById[targetEntryId] = targetEntry;
		} else {
			resultsWithoutId.push(cloneUnlessOtherwiseSpecified(targetEntry, options));
		}
	} 

	// build hash map for all source entries by id
	var sourceById = {};	
	for (i = 0; i < source.length; i++) {
		var sourceEntry = source[i];
		var sourceEntryId = sourceEntry[idProp];
		if (typeof(sourceEntryId) !== "undefined") {
			sourceById[sourceEntryId] = sourceEntry;
		} else {
			resultsWithoutId.push(cloneUnlessOtherwiseSpecified(sourceEntry, options));
		}
	} 

	// get all id keys from target & source
	var allIds = Object.keys({ ...targetById, ...sourceById });

	// deep merge all entries with the same id
	var distinctByIdMerged = allIds.map(id => {
		return deepmerge(targetById[id], sourceById[id] || {}, options);
	});
	
	return resultsWithoutId.concat(distinctByIdMerged);
}

function mergeObject(target, source, options) {
	var destination = {}
	if (options.isMergeableObject(target)) {
		Object.keys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options)
		})
	}
	Object.keys(source).forEach(function(key) {
		if (!options.isMergeableObject(source[key]) || !target[key]) {
			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options)
		} else {
			destination[key] = deepmerge(target[key], source[key], options)
		}
	})
	return destination
}

function deepmerge(target, source, options) {
	options = options || {}
	options.arrayMerge = options.arrayMerge || concatArrayMerge
	options.isMergeableObject = options.isMergeableObject || defaultIsMergeableObject

	var sourceIsArray = Array.isArray(source)
	var targetIsArray = Array.isArray(target)
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray

	if (!sourceAndTargetTypesMatch) {
		return cloneUnlessOtherwiseSpecified(source, options)
	} else if (sourceIsArray) {
		return options.arrayMerge(target, source, options)
	} else {
		return mergeObject(target, source, options)
	}
}

deepmerge.all = function deepmergeAll(array, options) {
	if (!Array.isArray(array)) {
		throw new Error('first argument should be an array')
	}

	return array.reduce(function(prev, next) {
		return deepmerge(prev, next, options)
	}, {})
}

deepmerge.arrayMergeById = arrayMergeById;

module.exports = deepmerge
