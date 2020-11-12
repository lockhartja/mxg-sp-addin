import { Injectable } from '@angular/core';
import { IBzCustomNameDictionary } from '@atypes';
import { DataProperty, EntityType, NamingConvention } from 'breeze-client';

/*
 *
 * NamingConventionWithDictionary plugin to the breeze.NamingConvention class
 *
 * Adds a NamingConvention that extends another NamingConvention
 * by attempting first to translate specific Entity property names using a dictionary.
 * If a property name is not found in the dictionary,
 * it falls back to the base NamingConvention (AKA "sourceNamingConvention").
 *
 * Copyright 2015 IdeaBlade, Inc.  All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the IdeaBlade Breeze license, available at http://www.breezejs.com/license
 *
 * Author: Ward Bell
 * Version: 0.1.0 - original
 *
 * Load this script after breeze
 *
 * Usage:
 *    var convention =
 *      new breeze.NamingConvention.NamingConventionWithDictionary(...)
 *
 */
@Injectable({ providedIn: 'root' })
export class CustomNameConventionService {
    private clientToServerDictionary: IBzCustomNameDictionary;
    private serverToClientDictionary: { [index: string]: EntityType };
    private sourceConvention: NamingConvention;

    constructor() {
        console.log('Naming Convention loaded');
    }

    createNameDictionary(
        name: string,
        sourceConv: NamingConvention,
        clientToServerDict: IBzCustomNameDictionary
    ): NamingConvention {
        if (!(sourceConv instanceof NamingConvention)) {
            throw new Error('must be a instance of a Naming Convention');
        }
        if (!name) {
            throw new Error('must be a non empty string');
        }
        this.clientToServerDictionary = clientToServerDict;
        this.sourceConvention = sourceConv;
        this.serverToClientDictionary = this.makeServerToClientDictionary();

        return new NamingConvention({
            name,
            clientPropertyNameToServer: (namer: string, propDef: DataProperty): string => {
                /**
                 * Special Case: property names for the SpMetadata entity are lowercase on the
                 * server, so we need to bypass renaming them.
                 */
                if (propDef?.parentType?.name === '__metadata:#global') {
                    return namer;
                }
                const typeName = propDef?.parentType?.name;
                const props = this.clientToServerDictionary[typeName || undefined];

                /**
                 * If a SpInternal is found in the dictionary, go ahead and use it in place
                 * of the client's known name for property.
                 */
                const newName = props && props[namer];

                /**
                 * if we have either the new name just return in it's proper case. i.e.
                 * the new name should already be in PascalCase not camelCase.
                 * or if the nameOnServer is the same as the name on the client, run it through
                 * breeze's base source convention. In this particular instance it will
                 * be the camelCase
                 */
                return newName || this.sourceConvention.clientPropertyNameToServer(namer, propDef);
            },
            serverPropertyNameToClient: (namer: string, propDef: DataProperty): string => {
                if (propDef?.parentType && propDef?.name === '__metadata:#global') {
                    return namer;
                }
                const typeName = propDef?.parentType?.name;
                const props = this.serverToClientDictionary[typeName || undefined];
                const newName = props && (props[namer] as string);
                return newName || this.sourceConvention.serverPropertyNameToClient(namer, propDef);
            },
        });
    }

    updateDictionary(dict: IBzCustomNameDictionary): void {
        const newDictKeys = Object.keys(dict);
        for (const key of newDictKeys) {
            this.clientToServerDictionary[key] = dict[key];
        }
        this.serverToClientDictionary = this.makeServerToClientDictionary();
    }

    // makes new dictionary based on clientToServerDictionary
    // that reverses each EntityType's {clientPropName: serverPropName} KV pairs
    makeServerToClientDictionary(): { [index: string]: EntityType } {
        const dict = {};
        for (const typename of Object.keys(this.clientToServerDictionary)) {
            const newType = {};
            const type = this.clientToServerDictionary[typename];
            for (const prop of Object.keys(type)) {
                newType[type[prop]] = prop; // reverse KV pair
            }
            dict[typename] = newType;
        }
        return dict;
    }
}
