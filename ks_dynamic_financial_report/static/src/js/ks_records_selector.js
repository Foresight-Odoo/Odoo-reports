/** @odoo-module **/

import { Domain } from "@web/core/domain";
import { useService } from "@web/core/utils/hooks";
import { TagsList } from "@web/views/fields/many2many_tags/tags_list";
import { Many2XAutocomplete } from "@web/views/fields/relational_utils";

const { Component, onWillStart, onWillUpdateProps } = owl;

export class KsRecordsSelector extends Component {
    setup() {
        /** @type {Record<number, string>} */
        this.displayNames = {};
        /** @type {import("@web/core/orm_service").ORM}*/
        this.orm = useService("orm");
        onWillStart(() => this.fetchMissingDisplayNames(this.props.resModel, this.props.resIds));
        onWillUpdateProps((nextProps) =>
            this.fetchMissingDisplayNames(nextProps.resModel, nextProps.resIds)
        );
    }

    get tags() {
        return this.props.resIds.map((rec) => ({
            text: this.displayNames[rec.id],
            onDelete: () => this.removeRecord(rec.id),
            displayBadge: true,
        }));
    }

    searchDomain() {
        var resIds = [];
        for (const index in this.props.resIds) {
            resIds.push(this.props.resIds[index].id);
        }
        console.log("==res===", resIds);
        console.log("==res2===", Domain.not([["id", "in", resIds]]).toList());
        return Domain.not([["id", "in", resIds]]).toList();
    }

    /**
     * @param {number} recordId
     */
    removeRecord(recordId) {
        delete this.displayNames[recordId];
        var resIds = [];
        if (this.props.resIds.length > 0){
            for (const index in this.props.resIds) {
                resIds.push(this.props.resIds[index].id);
            }
        }
        this.notifyChange(resIds.filter((res) => res !== recordId));
    }

    /**
     * @param {{ id: number; name?: string}[]} records
     */
    update(records) {
        console.log("records=====", records);
        console.log("records=====", records.map(({ id }) => id));
        // console.log("records=====", records.map(({ id }) => id));
        console.log("concat=====", this.props.resIds);
        for (const record of records.filter((record) => record.name)) {
            this.displayNames[record.id] = record.name;
        }
        var resIds = [];
        if (this.props.resIds.length > 0){
            for (const index in this.props.resIds) {
                resIds.push(this.props.resIds[index].id);
            }
        }
        this.notifyChange(resIds.concat(records.map(({ id }) => id)));
    }

    /**
     * @param {number[]} selectedIds
     */
    notifyChange(selectedIds) {
        console.log("selectedIds=====", selectedIds);
        console.log("selectedIds map=====", selectedIds.map((id) => ({ id, display_name: this.displayNames[id] })));
        this.props.onValueChanged(
            selectedIds.map((id) => ({ id, display_name: this.displayNames[id] }))
        );
    }

    /**
     * @param {string} resModel
     * @param {number[]} recordIds
     */
    async fetchMissingDisplayNames(resModel, recordIds) {
        console.log("recordIds====", recordIds);
        console.log("displayNames====", this.displayNames);
        const missingNameIds = recordIds.filter((record) => !(record.id in this.displayNames));
        console.log("missingNameIds====", missingNameIds);
        if (missingNameIds.length === 0) {
            return;
        }
        // var missingNameIds_2 = []
        // for(let i=0; i<missingNameIds.length; i++){
        //     console.log("ev=====", missingNameIds[i]);
        //     missingNameIds_2.push(missingNameIds[i].id);
        // }
        // console.log("missingNameIds_2====", missingNameIds_2);
        // const results = await this.orm.read(resModel, missingNameIds_2, ["display_name"]);
        // console.log("results====", results);
        for (const { id, display_name } of missingNameIds) {
            this.displayNames[id] = display_name;
        }
    }
}
KsRecordsSelector.components = { TagsList, Many2XAutocomplete };
KsRecordsSelector.template = "ksRecordsSelector";
KsRecordsSelector.props = {
    /**
     * Callback called when a record is selected or removed.
     * (selectedRecords: Array<{ id: number; display_name: string }>) => void
     **/
    onValueChanged: Function,
    resModel: String,
    /**
     * Array of selected record ids
     */
    resIds: {
        optional: true,
        type: Array,
    },
    placeholder: {
        optional: true,
        type: String,
    },
};
KsRecordsSelector.defaultProps = {
    resIds: [],
};
