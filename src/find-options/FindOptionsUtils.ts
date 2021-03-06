import {FindManyOptions} from "./FindManyOptions";
import {FindOneOptions} from "./FindOneOptions";
import {SelectQueryBuilder} from "../query-builder/SelectQueryBuilder";

/**
 * Utilities to work with FindOptions.
 */
export class FindOptionsUtils {

    /**
     * Checks if given object is really instance of FindOneOptions interface.
     */
    static isFindOneOptions(obj: any): obj is FindOneOptions<any> {
        const possibleOptions: FindOneOptions<any> = obj;
        return possibleOptions &&
                (
                    possibleOptions.select instanceof Array ||
                    possibleOptions.where instanceof Object ||
                    possibleOptions.relations instanceof Array ||
                    possibleOptions.join instanceof Object ||
                    possibleOptions.order instanceof Object ||
                    (possibleOptions.cache instanceof Object ||
                        typeof possibleOptions.cache === "boolean" || 
                        typeof possibleOptions.cache === "number")
                );
    }

    /**
     * Checks if given object is really instance of FindManyOptions interface.
     */
    static isFindManyOptions(obj: any): obj is FindManyOptions<any> {
        const possibleOptions: FindManyOptions<any> = obj;
        return possibleOptions && (
            this.isFindOneOptions(possibleOptions) ||
            typeof (possibleOptions as FindManyOptions<any>).skip === "number" ||
            typeof (possibleOptions as FindManyOptions<any>).take === "number"
        );
    }

    /**
     * Checks if given object is really instance of FindOptions interface.
     */
    static extractFindOneOptionsAlias(object: any): string|undefined {
        if (this.isFindOneOptions(object) && object.join)
            return object.join.alias;

        return undefined;
    }

    /**
     * Checks if given object is really instance of FindOptions interface.
     */
    static extractFindManyOptionsAlias(object: any): string|undefined {
        if (this.isFindManyOptions(object) && object.join)
            return object.join.alias;

        return undefined;
    }

    /**
     * Applies give find one options to the given query builder.
     */
    static applyFindOneOptionsOrConditionsToQueryBuilder<T>(qb: SelectQueryBuilder<T>, options: FindOneOptions<T>|Partial<T>|undefined): SelectQueryBuilder<T> {
        if (this.isFindOneOptions(options))
            return this.applyOptionsToQueryBuilder(qb, options);

        if (options)
            return qb.where(options);

        return qb;
    }

    /**
     * Applies give find many options to the given query builder.
     */
    static applyFindManyOptionsOrConditionsToQueryBuilder<T>(qb: SelectQueryBuilder<T>, options: FindManyOptions<T>|Partial<T>|undefined): SelectQueryBuilder<T> {
        if (this.isFindManyOptions(options))
            return this.applyOptionsToQueryBuilder(qb, options);

        if (options)
            return qb.where(options);

        return qb;
    }

    /**
     * Applies give find options to the given query builder.
     */
    static applyOptionsToQueryBuilder<T>(qb: SelectQueryBuilder<T>, options: FindOneOptions<T>|FindManyOptions<T>|undefined): SelectQueryBuilder<T> {

        // if options are not set then simply return query builder. This is made for simplicity of usage.
        if (!options || (!this.isFindOneOptions(options) && !this.isFindManyOptions(options)))
            return qb;

        // apply all options from FindOptions
        if (options.select) {
            qb.select(options.select.map(selection => qb.alias + "." + selection));
        }

        if (options.where)
            qb.where(options.where);

        if ((options as FindManyOptions<T>).skip)
            qb.skip((options as FindManyOptions<T>).skip!);

        if ((options as FindManyOptions<T>).take)
            qb.take((options as FindManyOptions<T>).take!);

        if (options.order)
            Object.keys(options.order).forEach(key => {
                const order = (options as FindOneOptions<T>).order![key as any];
                switch (order) {
                    case 1:
                        qb.addOrderBy(qb.alias + "." + key, "ASC");
                        break;
                    case -1:
                        qb.addOrderBy(qb.alias + "." + key, "DESC");
                        break;
                    case "ASC":
                        qb.addOrderBy(qb.alias + "." + key, "ASC");
                        break;
                    case "DESC":
                        qb.addOrderBy(qb.alias + "." + key, "DESC");
                        break;
                }
            });

        if (options.relations)
            options.relations.forEach(relation => {
                qb.leftJoinAndSelect(qb.alias + "." + relation, relation);
            });

        if (options.join) {
            if (options.join.leftJoin)
                Object.keys(options.join.leftJoin).forEach(key => {
                    qb.leftJoin(options.join!.leftJoin![key], key);
                });

            if (options.join.innerJoin)
                Object.keys(options.join.innerJoin).forEach(key => {
                    qb.innerJoin(options.join!.innerJoin![key], key);
                });

            if (options.join.leftJoinAndSelect)
                Object.keys(options.join.leftJoinAndSelect).forEach(key => {
                    qb.leftJoinAndSelect(options.join!.leftJoinAndSelect![key], key);
                });

            if (options.join.innerJoinAndSelect)
                Object.keys(options.join.innerJoinAndSelect).forEach(key => {
                    qb.innerJoinAndSelect(options.join!.innerJoinAndSelect![key], key);
                });
        }

        if (options.cache)
            qb.cache(options.cache);

        return qb;
    }

}
