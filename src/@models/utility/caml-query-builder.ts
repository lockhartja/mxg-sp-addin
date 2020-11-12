//https:docs.microsoft.com/en-us/sharepoint/dev/schema/values-element-query
import { XtendedEntityType } from '@atypes';
import { DataType } from 'breeze-client';

export class CamlQueryBuilder {
    private _queryString = '';
    private matchTracker = {
        _queryClauseCount: 0,
        _whereClauseCount: 0,
        _valuesClauseCount: 0,
        _inClauseCount: 0,
        _orClauseCount: 0,
    };

    constructor(private entityType: XtendedEntityType) {}

    addViewFields(): this {
        const viewFields = this.entityType.dataProperties
            .filter((dp) => !dp.isComplexProperty && !dp.isUnmapped && dp.isDataProperty)
            .map((dp) => {
                let dataType: string;

                if (dp.dataType === DataType.DateTime) {
                    dataType = 'DateTime';
                } else if (dp.dataType === DataType.String) {
                    dataType = 'Text';
                } else {
                    dataType = 'Integer';
                }

                return `<FieldRef Name="${dp.nameOnServer}" Type="${dataType}"/>`;
            });

        this._queryString += `<ViewFields>${viewFields.join('')}</ViewFields>`;

        return this;
    }

    openQuery(): this {
        this._queryString += '<Query>';
        this.matchTracker._queryClauseCount += 1;
        return this;
    }

    closeQuery(): this {
        this._queryString += '</Query>';
        this.matchTracker._queryClauseCount -= 1;
        return this;
    }

    openWhere(): this {
        this._queryString += '<Where>';
        this.matchTracker._whereClauseCount += 1;

        return this;
    }

    closeWhere(): this {
        this._queryString += '</Where>';
        this.matchTracker._whereClauseCount -= 1;
        return this;
    }

    openOr(): this {
        this._queryString += '<Or>';
        this.matchTracker._orClauseCount += 1;
        return this;
    }

    closeOr(): this {
        // Don't close an Or clause if it is not opened
        if (this.matchTracker._orClauseCount === 0) {
            return this;
        }
        this._queryString += '</Or>';
        this.matchTracker._orClauseCount -= 1;
        return this;
    }

    closeIn(): this {
        this._queryString += '</In>';
        this.matchTracker._inClauseCount -= 1;
        return this;
    }

    openIn(fieldName: string): this {
        const dp = this.entityType.dataProperties.find((dp) => dp.name === fieldName);

        let dataType: string;

        if (dp.dataType === DataType.DateTime) {
            dataType = 'DateTime';
        } else if (dp.dataType === DataType.String) {
            dataType = 'Text';
        } else {
            dataType = 'Integer';
        }

        this.matchTracker._inClauseCount += 1;
        this._queryString += `<In><FieldRef Name="${dp.nameOnServer}" Type="${dataType}"/>`;

        return this;
    }

    openValues(): this {
        this._queryString += '<Values>';
        this.matchTracker._valuesClauseCount += 1;
        return this;
    }

    closeValues(): this {
        this._queryString += '</Values>';
        this.matchTracker._valuesClauseCount -= 1;
        return this;
    }

    addValue(itemValue: string | number | Date): this {
        let dataType: string;

        if (typeof itemValue === 'number') {
            dataType = 'Integer';
        } else if (typeof itemValue === 'string') {
            dataType = 'Text';
        } else {
            dataType = 'DateTime';
        }

        this._queryString += `<Value Type="${dataType}">${itemValue as string}</Value>`;
        return this;
    }

    reset(): void {
        Object.keys(this.matchTracker).forEach((key) => (this.matchTracker[key] = 0));
        this._queryString = '';
    }

    get queryString(): string {
        const allKeyMatched = Object.keys(this.matchTracker).every((key) => this.matchTracker[key] === 0);

        if (!allKeyMatched) {
            throw Error('syntax error all clause are not matched');
        }

        return `<View>${this._queryString}</View>`;
    }
}
