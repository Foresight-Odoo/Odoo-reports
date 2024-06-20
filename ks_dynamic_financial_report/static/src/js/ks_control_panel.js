/** @odoo-module **/

import { ControlPanel } from "@web/search/control_panel/control_panel";

export class KsControlPanel extends ControlPanel {
    setup() {
        super.setup();
        console.log("this=====", this);
        // pagerProps
    }
}
KsControlPanel.template = "KsControlPanel";
