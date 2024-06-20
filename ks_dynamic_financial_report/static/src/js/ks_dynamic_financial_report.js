/** @odoo-module **/

import { registry } from "@web/core/registry";
const actionRegistry = registry.category("actions");
import { Component, onWillStart, useState, useExternalListener, onMounted, onWillPatch, onPatched, onWillRender, useRef, onWillUpdateProps, onRendered } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { Pager } from "@web/core/pager/pager";
import { useListener } from "@web/core/utils/hooks";
import { Layout } from "@web/search/layout";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { ControlPanel } from "@web/search/control_panel/control_panel";
import { KsControlPanel } from "./ks_control_panel";
import { KsRecordsSelector } from "./ks_records_selector";
import { _t } from "@web/core/l10n/translation";
// import { DateTimePicker } from "@web/core/datetime/datetime_picker";
import { DateTimePicker, DatePicker } from "@web/core/datepicker/datepicker";
import { renderToElement } from "@web/core/utils/render";
import { renderToMarkup, renderToString } from '@web/core/utils/render';
const { DateTime } = luxon;
// import { DateTimeInput } from '@web/core/datetime/datetime_input';
import { session } from "@web/session";
import { formatMonetary } from "@web/views/fields/formatters";
import { formatFloat } from "@web/views/fields/formatters";
import { areDateEquals, formatDate, formatDateTime, parseDate } from "@web/core/l10n/dates";
import { parseFloat } from "@web/views/fields/parsers";
//import { KSReportFilters } from "./filters";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
// import { MultiRecordSelector } from "@web/core/record_selectors/multi_record_selector";


class ksDynamicReportsWidget extends Component {
    constructor() {
        super(...arguments);
        this.partner_ledger = useState({ ks_report_lines: false, });;
    }

    setup() {
        this.controlPanelDisplay = {
            "top-left": true,
            "top-right": true,
            "bottom-left": true,
            "bottom-right": true,
        };
        // this.move_line_age_pay = useRef("move_line_age_pay");
        // const $el = $(document).find('.ks_view-source');
        // console.log("==move==", $el);
        // useExternalListener(this.move_line_age_pay.el, "click", this.ksgetaction, { capture: true });
        // useListener("click", ".ks_view-source", this.ksgetaction);
        this.search_view_fields = {
                    date: {
                        name: "date",
                        string: "Date",
                        type: "date",
                        store: true,
                        sortable: true,
                        searchable: true,
                    },
                    stage_id: {
                        name: "stage_id",
                        string: "Stage",
                        type: "many2one",
                        store: true,
                        sortable: true,
                        searchable: true,
                    },
                };
        this.orm = useService("orm");
        this.action = useService("action");
        this.user = useService("user");
        this.rpc = useService("rpc");
        this.dialogService = useService('dialog');
        this.notificationService = useService("notification");
        this.state = useState({ offset: 0, limit: 200 });
        this.sort_order = useState({ order: "asc", });
        this.sort_data = useState({ ks_report_lines: false, });
        this.partner_ledger = useState({ ks_report_lines: {}, });
        this.sort_field = undefined;
        this.sort_list = undefined;
        this.ks_hide_debit_credit = false;
        this.props.ks_master_value = false;
        this.page_result = false;
        this.partner_state = useState({ ks_partner_ids: false, });
        onWillStart(async () => {
            await this.ksRenderBody(this.state.offset, this.state.limit, 'balance', this.sort_order.order);
        });
        onWillPatch(async () => {
            console.log("off patch===", this);
            if (this.sort_list){
                // await this.ksRenderBody(this.state.offset, this.state.limit);
                this.partner_ledger.ks_report_lines = await this.props.ks_report_lines;
            }
            // this.render(true);
        });

        onWillUpdateProps((nextProps) => {
            console.log("nextProps======", nextProps)
            // this.allColumns = nextProps.archInfo.columns;
            // this.state.columns = this.getActiveColumns(nextProps.list);
        });
        onPatched(async () => {
            // this.props.ks_master_value = await this.page_result;
            console.log("onpatch======", this);
        })
        onWillRender(async () => {
            this.partner_ledger.ks_report_lines = await this.props.ks_report_lines;
            await Promise.resolve();
            if (this.sort_field){
                // await this.ksRenderBody(this.state.offset, this.state.limit);
                // this.sort_list = await this.props.ks_report_lines;
                this.ks_report_lines = await this.props.ks_report_lines;
            }
            console.log("onwillrender======", this);
        });
        onRendered(async () => {
            await Promise.resolve();
            console.log("onrender======", this);
        });

        // onMounted(() => {
        //     const $el = $(document).find('.dropdown-menu');
        //     console.log("====el====", $el)
        //     if ($el.length > 0) {
        //         for (const index in $el){
        //             const ksgetaction = this.ksgetaction.bind(this);
        //             index.on("click", ksgetaction);
        //         }
        //     }
        // });

    }

    getpagerProps() {
        var list = [];
        // this.offset = 0;
        // this.limit = 80;
        if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_rec_action' || this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pay_action'){
            for (const line in this.props.ks_master_value.ks_partner_dict){
                list.push(line);
            }
            // console.log("count========", this.partner_count);
        }
        else {
            list = this.ks_report_lines;
        }
        var ks_partner_dict = {};
        // console.log("this.ks_report_lines========", this.ks_report_lines);
        // console.log("this.ks_report_lines========", this.ks_partner_dict);
        return {
            offset: this.state.offset,
            limit: this.state.limit,
            total: this.partner_count,
            onUpdate: async ({ offset, limit }) => {
                // await list.load({ limit, offset });
                // console.log("off===", offset, limit)
                // Object.assign(this.state, newState);
                console.log("off b4===", this.state.offset);
                this.state.offset = offset;
                console.log("off===", this.state.offset);
                var self = this;
                // self.offset = offset+limit;
                if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_rec_action' || this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pay_action' || this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pl_action'){
                    // console.log("slice=====", list.slice(offset, (offset+limit)))
                    console.log("ks_partner_dict=====", this);
                    await this.ksRenderBody(this.state.offset, this.state.limit, 'balance', this.sort_order.order);
                    this.partner_state.ks_partner_ids = this.page_result.ks_partner_dict;
                    this.ks_report_lines = this.page_result.ks_report_lines;
                    this.partner_ledger.ks_report_lines = this.page_result.ks_report_lines;
                    // if (this.sort_field){
                    //     await this.sortBy(this.partner_ledger.ks_report_lines, this.sort_field, 'asc')
                    // }
                    this.sort_list = this.page_result.ks_report_lines
                    console.log("ks_partner_dict=====", this);
                    // if (Object.keys(this.ks_partner_dict).length < 2){
                    //     for (const off in Array.from({length: ((this.state.offset+1000) - this.state.offset)/80 + 1}, (_, i) => this.state.offset + i * 80)){
                    //         console.log("off loop====", off)
                    //         await this.ksRenderBody(parseInt(off), this.state.limit);
                    //         if (Object.keys(this.ks_partner_dict).length > 2){
                    //             break;
                    //         }

                    //     }
                    // }

                }
                else {
                    this.ks_report_lines = this.ks_report_lines.slice(offset, (offset+limit));
                }

                console.log("this.page_result========", this.page_result);
                
                this.render();
            },
            withAccessKey: false,
        };
    }

    async _onClickRefresh(event){
        event.preventDefault();
        this.render(true);
        this.sort_field = undefined;
        this.sort_list = undefined
        await this.ksRenderBody(this.state.offset, this.state.limit, 'balance', this.sort_order.order);
        $('.o_pager_previous').removeClass('o_disabled');//classList
        $('.o_pager_next').removeClass('o_disabled');//classList
        $('.o_cp_bottom_left').removeClass('o_disabled');
        $('.o_cp_top_right').removeClass('o_disabled');
        $('.o_cp_top_left').removeClass('o_disabled');


    }

    async onClickSortColumn(column) {
        if (this.preventReorder) {
            this.preventReorder = false;
            return;
        }
        
        const fieldName = column;
        if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_rec_action' || this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pay_action'){
            var list = this.props.ks_master_value.ks_partner_dict;
        }
        else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pl_action'){
            var list = this.props.ks_report_lines;
        }
        else if (this.props.action.xml_id === 'ks_dynamic_financial_report.ks_df_tb_action'){
            var list = this.props.ks_report_lines;
        }
        else {
            var list = this.ks_report_lines;
        }
        this.sort_field = column
        await this.sortBy(list, column, this.sort_order.order);
        // this.partner_ledger.ks_report_lines = page_result.ks_report_lines;
        this.sort_order.order = this.sort_order.order === 'asc' ? 'desc': 'asc'
        if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_rec_action' || this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pay_action' || this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pl_action'){
            $('.o_pager_previous').addClass('o_disabled');//classList
            $('.o_pager_next').addClass('o_disabled');//classList
            $('.o_cp_bottom_left').addClass('o_disabled');
            $('.o_cp_top_right').addClass('o_disabled');
            $('.o_cp_top_left').addClass('o_disabled');
        }
        this.render();
        // }
    }

    async sortBy(data, column, order){
        console.log("sortable1=======", data);
        console.log("sortable1=======", data instanceof Array);
        var fieldName = column.split("_")[1];
        if (!(data instanceof Array)){
            if (this.props.action.xml_id === 'ks_dynamic_financial_report.ks_df_pl_action'){
                var sortable = Object.keys(data).sort(function(a,b){
                    // console.log("a===", parseFloat((data[a][fieldName]).slice(0, -2)), parseFloat((data[b][fieldName]).slice(0, -2)));
                    if (order === 'asc'){
                        return parseFloat((data[a][fieldName]).slice(0, -2)) - parseFloat((data[b][fieldName]).slice(0, -2));
                    } else {
                        return parseFloat((data[b][fieldName]).slice(0, -2)) - parseFloat((data[a][fieldName]).slice(0, -2));
                    }
                });
                var sortable2 = Object.fromEntries(
                    Object.entries(data).sort(function([,a],[,b]) {
                        // console.log("a=====", a, b)
                        if (order === 'asc'){
                            return parseFloat((a[fieldName]).slice(0, -2)) - parseFloat((b[fieldName]).slice(0, -2));
                        } else {
                            return parseFloat((b[fieldName]).slice(0, -2)) - parseFloat((a[fieldName]).slice(0, -2));
                        }
                    })
                );
                console.log("sortable3====", sortable2);
            } else {
                if (this.props.action.xml_id === 'ks_dynamic_financial_report.ks_df_tb_action'){
                    //trial balance sort
                    var fieldName = column.replace('trail_', '');
                    console.log("fieldName===", fieldName);
                }
                var sortable = Object.keys(data).sort(function(a,b){
                    // console.log("a===", parseFloat((data[a][fieldName]).slice(0, -2)), parseFloat((data[b][fieldName]).slice(0, -2)));
                    if (order === 'asc'){
                        return parseFloat((data[a][fieldName]).slice(0, -2)) - parseFloat((data[b][fieldName]).slice(0, -2));
                    } else {
                        return parseFloat((data[b][fieldName]).slice(0, -2)) - parseFloat((data[a][fieldName]).slice(0, -2));
                    }
                });
            }
        } else if (this.props.action.xml_id === 'ks_dynamic_financial_report.ks_df_es_action'){
            // executive summary sort
            var account_data = data.filter((res) => res.ks_level === 2);
            var report_data = data.filter((res) => res.ks_level === 1);
            console.log("account dat====", account_data)
            console.log("report_data====", report_data)
            var full_data_sort = data.sort(function(a,b){
                // console.log("a===", a, b);
                if (a.ks_level === 2 && b.ks_level === 2){
                    if (a[fieldName] && b[fieldName]){
                        // console.log("a===", a[fieldName][Object.keys(a[fieldName])[0]], b[fieldName][Object.keys(b[fieldName])[0]]);
                        if (order === 'asc'){
                            return parseFloat((a[fieldName][Object.keys(a[fieldName])[0]]).slice(0, -2)) - parseFloat((b[fieldName][Object.keys(b[fieldName])[0]]).slice(0, -2));
                        } else {
                            return parseFloat((b[fieldName][Object.keys(b[fieldName])[0]]).slice(0, -2)) - parseFloat((a[fieldName][Object.keys(a[fieldName])[0]]).slice(0, -2));
                        }
                    } else {
                        return 0
                    }
                } else {
                    return 0
                }
            });
            // var sortable = report_data.concat(account_data_sort);
            var sortable = full_data_sort;
        } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_cj_action'){
            //consilidated journal sort
            var full_data_sort = data.sort(function(a,b){
                console.log("a===", a, b);
                if (a.id != 'total' && b.id != 'total'){
                    if (a[fieldName] && b[fieldName]){
                        console.log("a===", a[fieldName], b[fieldName]);
                        if (order === 'asc'){
                            return parseFloat((a[fieldName]).slice(0, -2)) - parseFloat((b[fieldName]).slice(0, -2));
                        } else {
                            return parseFloat((b[fieldName]).slice(0, -2)) - parseFloat((a[fieldName]).slice(0, -2));
                        }
                    } else {
                        return 0
                    }               
                } else {
                    return 0
                }
            });
            console.log("full sort===", full_data_sort);
            // var sortable = report_data.concat(account_data_sort);
            var sortable = full_data_sort;
        } else if (this.props.action.xml_id === 'ks_dynamic_financial_report.ks_df_tb_action'){
            //trial balance sort
            fieldName = column.split('trial_')[-1];
            console.log("fieldName===", fieldName);
            var full_data_sort = data.sort(function(a,b){
                // console.log("a===", a, b);
                if (a[fieldName] && b[fieldName]){
                    console.log("a===", a[fieldName], b[fieldName]);
                    if (order === 'asc'){
                        return parseFloat((a[fieldName]).slice(0, -2)) - parseFloat((b[fieldName]).slice(0, -2));
                    } else {
                        return parseFloat((b[fieldName]).slice(0, -2)) - parseFloat((a[fieldName]).slice(0, -2));
                    }
                } else {
                    return 0
                }               
            });
            console.log("full sort===", full_data_sort);
            var sortable = full_data_sort;
        } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_pnl0'){
            //profit and loss sort
            var full_data_sort = data.sort(function(a,b){
                if (a.ks_df_report_account_type != 'report' && b.ks_df_report_account_type != 'report'){
                    // console.log("ab===", parseFloat((a[fieldName]).slice(0, -2)), parseFloat((b[fieldName]).slice(0, -2)));
                    if (a.parent === b.parent){
                        if (order === 'asc'){
                            return parseFloat((a[fieldName]).slice(0, -2)) - parseFloat((b[fieldName]).slice(0, -2));
                        } else {
                            return parseFloat((b[fieldName]).slice(0, -2)) - parseFloat((a[fieldName]).slice(0, -2));
                        }
                    } else {
                        return 0;
                    }
                } else {
                    return 0;
                }
            });
            var sortable = full_data_sort;
            // this.partner_ledger.ks_report_lines = full_data_sort;
        } else {
            var account_data = data.filter((res) => res.ks_df_report_account_type === 'account');
            var report_data = data.filter((res) => res.ks_df_report_account_type === 'report');
            console.log("account dat====", account_data)
            console.log("report_data====", report_data)
            var account_data_sort = account_data.sort(function(a,b){
                if (order === 'asc'){
                    return parseFloat((a[fieldName]).slice(0, -2)) - parseFloat((b[fieldName]).slice(0, -2));
                } else {
                    return parseFloat((b[fieldName]).slice(0, -2)) - parseFloat((a[fieldName]).slice(0, -2));
                }
            })
            var full_data_sort = data.sort(function(a,b){
                if (a.ks_df_report_account_type != 'report' && b.ks_df_report_account_type != 'report'){
                    // console.log("a===", parseFloat((a[fieldName]).slice(0, -2)), parseFloat((b[fieldName]).slice(0, -2)));
                    if (a[fieldName] && b[fieldName]){
                        if (order === 'asc'){
                            return parseFloat((a[fieldName]).slice(0, -2)) - parseFloat((b[fieldName]).slice(0, -2));
                        } else {
                            return parseFloat((b[fieldName]).slice(0, -2)) - parseFloat((a[fieldName]).slice(0, -2));
                        }
                    } else {
                        return 0;
                    }
                } else {
                    return 0;
                }
            });
            console.log("full sort===", full_data_sort);
            console.log("account sort===", account_data_sort);
            // var sortable = report_data.concat(account_data_sort);
            var sortable = full_data_sort;
        }
        
        // console.log("sortable2=======", sortable);
        this.sort_list = sortable;
        this.partner_ledger.ks_report_lines = sortable;
        this.props.ks_report_lines = data;
        this.sort_data.ks_report_lines = sortable;
    }

    getSortableIconClass(column) {
        const { orderBy } = this.props.ks_master_value;
        // console.log("this=====", this);
        const classNames = ["fa", "fa-lg", "px-2"];
        if (this.sort_field && this.sort_field === column ) {
            // orderBy.ks_partner_dict[0]
            classNames.push(this.sort_order.order === 'asc' ? "fa-angle-up" : "fa-angle-down");
        } else {
            classNames.push("opacity-0", "opacity-75-hover");//"fa-angle-down", 
        }

        return classNames.join(" ");
    }

    get partner_ks_report(){
        return this.partner_ledger.ks_report_lines
    }

    get end_date(){
        console.log("====end date===", this.props.ks_end_date)
        if (typeof this.props.ks_end_date === 'string' || typeof this.props.ks_end_date === 'boolean'){
            var ks_end_date = parseDate(this.props.ks_end_date)
        }
        else {
            var ks_end_date = DateTime.fromISO(this.props.ks_end_date)
        }
        // return typeof this.props.ks_end_date === 'string' ? DateTime.fromISO(this.props.ks_end_date) : parseDate(this.props.ks_end_date);
        return ks_end_date;
    }

    get date_from_cmp(){
        console.log("====end date===", this.props.date_to_cmp)
        // typeof props.date_from_cmp === 'string' ? null : props.date_from_cmp
        if (typeof this.props.date_from_cmp === 'string' || typeof this.props.date_from_cmp === 'boolean'){
            var date_from_cmp = parseDate(this.props.date_from_cmp)
        }
        else {
            var date_from_cmp = DateTime.fromISO(this.props.date_from_cmp)
        }
        
        return date_from_cmp;
    }

    get date_to_cmp(){
        console.log("====end date===", this.props.date_to_cmp)
        // typeof props.date_to_cmp === 'string' ? null : props.date_to_cmp
        if (typeof this.props.date_to_cmp === 'string' || typeof this.props.date_to_cmp === 'boolean'){
            var date_to_cmp = parseDate(this.props.date_to_cmp)
        }
        else {
            var date_to_cmp = DateTime.fromISO(this.props.date_to_cmp);
        }
        
        return date_to_cmp;
    }

    async _ksRenderPageBody(offset, limit) {
        var ks_result = this.orm.silent.call('ks.dynamic.financial.reports', 'ks_get_dynamic_fin_info', [this.props.action.context.id,
            this.ks_df_report_opt, offset, limit
        ], {
            context: this.props.action.context
        })
        var ks_result_res = ks_result;
        return Promise.resolve(ks_result_res);
    }

    async ksSetReportInfo(values) {
        this.ks_df_reports_ids = values.ks_df_reports_ids;
        this.ks_df_report_opt = values.ks_df_informations;
        this.ks_df_context = values.context;
        this.ks_report_manager_id = values.ks_report_manager_id;
        this.ks_remarks = values.ks_remarks;
        this.$ks_buttons = $(values.ks_buttons);
        this.$ks_searchview_buttons = $(values.ks_searchview_html);
        this.ks_currency = values.ks_currency;
        this.ks_report_lines = values.ks_report_lines;
        this.ks_enable_ledger_in_bal = values.ks_enable_ledger_in_bal;
        this.ks_initial_balance = values.ks_initial_balance;
        this.ks_current_balance = values.ks_current_balance;
        this.ks_ending_balance = values.ks_ending_balance;
        this.ks_diff_filter = values.ks_diff_filter;
        this.ks_retained = values.ks_retained;
        this.ks_subtotal = values.ks_subtotal;
        this.ks_partner_dict = values.ks_partner_dict
        this.ks_period_list = values.ks_period_list
        this.ks_period_dict = values.ks_period_dict
        this.ks_month_lines = values.ks_month_lines
        //            this.ksSaveReportInfo();
    }



    async ksRenderBody(offset, limit, sort_field, order) {
        await this.orm.call('ks.dynamic.financial.reports', 'ks_get_dynamic_fin_info', [this.props.action.context.id,
        this.ks_df_report_opt, offset, limit], {context:this.props.action.context}).then((result) => {

            //            if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_rec_action'){
            this.props.date_to_cmp =""
            this.props.date_from_cmp =""
            this.props.ks_end_date =false
            this.props.previos =""
            this.props.ks_master_value = result
            this.ksSetReportInfo(result);
            this.page_result = result;
            this.ks_df_context = result.context;
            this.ks_df_report_opt = result['ks_df_informations']
            this.props.ks_df_report_opt = result['ks_df_informations']
            this.props.ks_df_report_opt = result['ks_df_informations']
            var ksFormatConfigurations = {
                currency_id: result.ks_currency,
                noSymbol: true,
            };
            this.initial_balance = this.ksFormatCurrencySign(result.ks_initial_balance, ksFormatConfigurations, result.ks_initial_balance < 0 ? '-' : '');
            this.current_balance = this.ksFormatCurrencySign(result.ks_current_balance, ksFormatConfigurations, result.ks_current_balance < 0 ? '-' : '');
            this.ending_balance = this.ksFormatCurrencySign(result.ks_ending_balance, ksFormatConfigurations, result.ks_ending_balance < 0 ? '-' : '');

            this.ks_partner_dict = result['ks_partner_dict'];
            this.partner_state.ks_partner_ids = result['ks_partner_dict']
            // console.log("=====ks pat==", Object.keys(result['ks_partner_dict']).length)
            this.ks_period_list = result['ks_period_list']
            this.ks_period_dict = result['ks_period_dict']
            this.ks_report_lines = result['ks_report_lines']
            // this.sort_data.ks_report_lines = result['ks_report_lines']

            if (this.props.action.xml_id != 'ks_dynamic_financial_report.ks_df_tax_report_action' && this.props.action.xml_id != 'ks_dynamic_financial_report.ks_df_es_action') {
                this.ksSetReportCurrencyConfig();
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_tax_report_action') {
                this.ksSetTaxReportCurrencyConfig();
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_es_action') {
                this.ksSetExecutiveReportCurrencyConfig();
            }



            if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_tax_report_action') {
                this.props.ks_df_report_opt = result['ks_df_informations']
                this.props.ks_report_lines = result['ks_report_lines']
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_rec_action') {
                this.props.ks_partner_dict = result['ks_partner_dict']
                this.ksRenderAgeReceivable(result);
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pay_action') {
                this.ksRenderAgePayable()
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_cj_action') {
                this.props.lang = result.context.lang
                this.ksRenderConsolidateJournal()
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_es_action') {
                this.props.ks_df_report_opt = result['ks_df_informations']
                this.props.ks_report_lines = result['ks_report_lines']
                this.ksRenderExecutiveSummary(result)
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_tb_action') {
                this.ks_report_lines = result['ks_report_lines']
                this.ks_retained = result['ks_retained']
                this.ks_subtotal = result['ks_subtotal']
                this.props.ks_report_lines = result['ks_report_lines']
                this.ks_df_report_opt = result['ks_df_informations']
                this.ksRenderTrialBalance();
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_gl_action') {
                this.props.ks_report_lines = result['ks_report_lines']
                this.props.ks_enable_ledger_in_bal = result['ks_enable_ledger_in_bal']
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pl_action') {
                this.props.ks_report_lines = result['ks_report_lines']
                this.partner_ledger.ks_report_lines = Object.keys(result['ks_report_lines']).sort(function(a,b){
                    // console.log("a===", parseFloat((data[a][fieldName]).slice(0, -2)), parseFloat((data[b][fieldName]).slice(0, -2)));
                    if (order === 'asc'){
                        return parseFloat((result['ks_report_lines'][a][sort_field]).slice(0, -2)) - parseFloat((result['ks_report_lines'][b][sort_field]).slice(0, -2));
                    } else {
                        return parseFloat((result['ks_report_lines'][b][sort_field]).slice(0, -2)) - parseFloat((result['ks_report_lines'][a][sort_field]).slice(0, -2));
                    }
                });
                console.log("rrpoty====", this.partner_ledger.ks_report_lines)
                // var sortable = Object.keys(data).sort(function(a,b){
                //     // console.log("a===", parseFloat((data[a][fieldName]).slice(0, -2)), parseFloat((data[b][fieldName]).slice(0, -2)));
                //     if (order === 'asc'){
                //         return parseFloat((data[a][fieldName]).slice(0, -2)) - parseFloat((data[b][fieldName]).slice(0, -2));
                //     } else {
                //         return parseFloat((data[b][fieldName]).slice(0, -2)) - parseFloat((data[a][fieldName]).slice(0, -2));
                //     }
                // });
                this.props.ks_enable_ledger_in_bal = result['ks_enable_ledger_in_bal']
            } else {
                this.props.ks_report_lines = result['ks_report_lines']
                this.props.ks_df_report_opt = result['ks_df_informations']
                this.props.ks_initial_balance = result['ks_initial_balance']
                this.props.ks_current_balance = result['ks_current_balance']
                this.props.ks_ending_balance = result['ks_ending_balance']
                if (parseFloat(String(result.ks_initial_balance)) > 0 || parseFloat(String(result.ks_current_balance)) > 0 || parseFloat(String(result.ks_ending_balance)) > 0) {
                    this.props.showgenreport = true
                } else {
                    this.props.showgenesreport = false
                }
            }
            //            }
        })
        // var partner_ids = []
        if (!this.partner_count){
            await this.orm.call('ks.dynamic.financial.reports', 'ks_length_info', [this.props.action.context.id, this.ks_df_report_opt],{context:this.props.action.context}).then((result) => {
                this.partner_count = result['total_partners'];
                this.total_credit = result['total_credit'];
                this.total_debit = result['total_debit'];
                this.total_balance = result['total_balance'];
            });
        }


    }
    async _ksRenderBody() {
        this.state.offset = 0
        this.state.limit = 100
        this.ks_result = this.orm.silent.call('ks.dynamic.financial.reports', 'ks_get_dynamic_fin_info', [this.props.action.context.id,
            this.ks_df_report_opt, this.state.offset, this.state.limit
        ], {
            context: this.props.action.context
        })
        var ks_result = this.ks_result;
        await this.orm.call('ks.dynamic.financial.reports', 'ks_length_info', [this.props.action.context.id, this.ks_df_report_opt],{context:this.props.action.context}).then((result) => {
            this.total_credit = result['total_credit'];
            this.total_debit = result['total_debit'];
            this.total_balance = result['total_balance'];
        });
        return Promise.resolve(ks_result);
    }

    async ksRenderTrialBalance() {
        var self = this;

        Object.entries(self.ks_report_lines).forEach(([v, k]) => {
            var ksFormatConfigurations = {
                currency_id: k.company_currency_id,
                noSymbol: true,
            };
            k.initial_debit = self.ksFormatCurrencySign(k.initial_debit, ksFormatConfigurations, k.initial_debit < 0 ? '-' : '');
            k.initial_credit = self.ksFormatCurrencySign(k.initial_credit, ksFormatConfigurations, k.initial_credit < 0 ? '-' : '');
            k.initial_balance = self.ksFormatCurrencySign(k.initial_balance, ksFormatConfigurations, k.initial_balance < 0 ? '-' : '');
            k.ending_debit = self.ksFormatCurrencySign(k.ending_debit, ksFormatConfigurations, k.ending_debit < 0 ? '-' : '');
            k.ending_credit = self.ksFormatCurrencySign(k.ending_credit, ksFormatConfigurations, k.ending_credit < 0 ? '-' : '');
            k.ending_balance = self.ksFormatCurrencySign(k.ending_balance, ksFormatConfigurations, k.ending_balance < 0 ? '-' : '');
        });
        Object.entries(self.ks_retained).forEach(([v, k]) => {
            var ksFormatConfigurations = {
                currency_id: k.company_currency_id,
                noSymbol: true,
            };
            k.debit = self.ksFormatCurrencySign(k.debit, ksFormatConfigurations, k.debit < 0 ? '-' : '');
            k.credit = self.ksFormatCurrencySign(k.credit, ksFormatConfigurations, k.credit < 0 ? '-' : '');
            k.balance = self.ksFormatCurrencySign(k.balance, ksFormatConfigurations, k.balance < 0 ? '-' : '');
            k.initial_debit = self.ksFormatCurrencySign(k.initial_debit, ksFormatConfigurations, k.initial_debit < 0 ? '-' : '');
            k.initial_credit = self.ksFormatCurrencySign(k.initial_credit, ksFormatConfigurations, k.initial_credit < 0 ? '-' : '');
            k.initial_balance = self.ksFormatCurrencySign(k.initial_balance, ksFormatConfigurations, k.initial_balance < 0 ? '-' : '');
            k.ending_debit = self.ksFormatCurrencySign(k.ending_debit, ksFormatConfigurations, k.ending_debit < 0 ? '-' : '');
            k.ending_credit = self.ksFormatCurrencySign(k.ending_credit, ksFormatConfigurations, k.ending_credit < 0 ? '-' : '');
            k.ending_balance = self.ksFormatCurrencySign(k.ending_balance, ksFormatConfigurations, k.ending_balance < 0 ? '-' : '');
        });
        Object.entries(self.ks_subtotal).forEach(([v, k]) => {
            var ksFormatConfigurations = {
                currency_id: k.company_currency_id,
                noSymbol: true,
            };
            k.debit = self.ksFormatCurrencySign(k.debit, ksFormatConfigurations, k.debit < 0 ? '-' : '');
            k.credit = self.ksFormatCurrencySign(k.credit, ksFormatConfigurations, k.credit < 0 ? '-' : '');
            k.balance = self.ksFormatCurrencySign(k.balance, ksFormatConfigurations, k.balance < 0 ? '-' : '');
            k.initial_debit = self.ksFormatCurrencySign(k.initial_debit, ksFormatConfigurations, k.initial_debit < 0 ? '-' : '');
            k.initial_credit = self.ksFormatCurrencySign(k.initial_credit, ksFormatConfigurations, k.initial_credit < 0 ? '-' : '');
            k.initial_balance = self.ksFormatCurrencySign(k.initial_balance, ksFormatConfigurations, k.initial_balance < 0 ? '-' : '');
            k.ending_debit = self.ksFormatCurrencySign(k.ending_debit, ksFormatConfigurations, k.ending_debit < 0 ? '-' : '');
            k.ending_credit = self.ksFormatCurrencySign(k.ending_credit, ksFormatConfigurations, k.ending_credit < 0 ? '-' : '');
            k.ending_balance = self.ksFormatCurrencySign(k.ending_balance, ksFormatConfigurations, k.ending_balance < 0 ? '-' : '');
        });
        var new_date_format = 'yyyy-M-d';
        //                    if (this.ks_df_report_opt['date']['ks_end_date']) {
        //                         this.ks_df_report_opt['date']['ks_end_date'] = moment(this.ks_df_report_opt['date']['ks_end_date']).format(new_date_format)
        //                        }
        //                     ks_df_new_report_opt['date']['ks_end_date'] = moment(self.ks_df_report_opt['date']['ks_end_date']).format(new_date_format)
        //                     ks_df_report_new_opt['date']['ks_start_date'] = moment(self.ks_df_report_opt['date']['ks_start_date']).format(new_date_format)
        self.props.ks_df_new_start_report_opt = DateTime.fromISO(self.ks_df_report_opt['date']['ks_start_date']).toISODate(new_date_format)
        self.props.account_data = this.ks_report_lines
        self.props.retained = this.ks_retained
        self.props.subtotal = this.ks_subtotal
        self.props.ks_df_new_end_report_opt = DateTime.fromISO(self.ks_df_report_opt['date']['ks_end_date']).toISODate(new_date_format)
        //            self.$('.o_content').html(QWeb.render('ks_df_trial_balance', {
        //
        //                    account_data: self.ks_report_lines,
        //                    retained: self.ks_retained,
        //                    ks_df_new_start_report_opt: ks_df_new_start_report_opt,
        //                    ks_df_new_end_report_opt: ks_df_new_end_report_opt,
        //                    subtotal: self.ks_subtotal,
        //                }));
        //                ks_df_report_opt['date']['ks_end_date'] = moment(ks_df_report_opt['date']['ks_end_date']).format(new_date_format)
    }
    async onDateTimeChanged(date){
        console.log("date====", date);
        this.props.ks_end_date = date
    }
    async fdate_from_cmp(e){
        this.props.date_from_cmp = e
    }
    async fdate_to_cmp(e){

        this.props.date_to_cmp = e
    }
    /**
     * @method to render Age Receivable report
     */
    async ksRenderAgeReceivable(result) {
        var self = this;

        Object.entries(self.ks_partner_dict).forEach(([v, k]) => {
            var ksFormatConfigurations = {
                currency_id: k.company_currency_id,
                noSymbol: true,
            };
            for (var z = 0; z < self.ks_period_list.length; z++) {
                k[self.ks_period_list[z]] = self.ksFormatCurrencySign(k[self.ks_period_list[z]], ksFormatConfigurations, k[self.ks_period_list[z]] < 0 ? '-' : '');
            }
            k.total = self.ksFormatCurrencySign(k.total, ksFormatConfigurations, k.total < 0 ? '-' : '');
        });
        self.props.ks_period_list = result.ks_period_list
        self.props.ks_period_dict = result.ks_period_dict
        self.props.ks_partner_dict = result.ks_partner_dict
    }




    /**
     * @method to render Age Payable report
     */
    async ksRenderAgePayable() {
        var self = this;

        Object.entries(self.ks_partner_dict).forEach(([v, k]) => {
            var ksFormatConfigurations = {
                currency_id: k.company_currency_id,
                noSymbol: true,
            };
            for (var z = 0; z < self.ks_period_list.length; z++) {
                k[self.ks_period_list[z]] = self.ksFormatCurrencySign(k[self.ks_period_list[z]], ksFormatConfigurations, k[self.ks_period_list[z]] < 0 ? '-' : '');
            }
            k.total = self.ksFormatCurrencySign(k.total, ksFormatConfigurations, k.total < 0 ? '-' : '');
        });
        self.props.ks_period_list = self.ks_period_list
        self.props.ks_period_dict = self.ks_period_dict
        self.props.ks_partner_dict = self.ks_partner_dict
    }
    async ksSetReportCurrencyConfig() {
        var self = this;

        Object.entries(self.ks_report_lines).forEach(([v, k]) => {
            var ksFormatConfigurations = {
                currency_id: k.company_currency_id,
                noSymbol: true,
            };
            k.debit = self.ksFormatCurrencySign(k.debit, ksFormatConfigurations, k.debit < 0 ? '-' : '');
            k.credit = self.ksFormatCurrencySign(k.credit, ksFormatConfigurations, k.credit < 0 ? '-' : '');
            if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_tb_action')) {

            } else {
                k.initial_balance = self.ksFormatCurrencySign(k.initial_balance, ksFormatConfigurations, k.initial_balance < 0 ? '-' : '');
            }
            //  changed the values of balance
            if (!k['percentage']) {
                k.balance = self.ksFormatCurrencySign(k.balance, ksFormatConfigurations, k.balance < 0 ? '-' : '');
            } else {
                k.balance = String(Math.round(k.balance)) + "%";
            }

            for (const prop in k.balance_cmp) {
                k.balance_cmp[prop] = self.ksFormatCurrencySign(k.balance_cmp[prop], ksFormatConfigurations, k.balance[prop] < 0 ? '-' : '');
            }
        });
    }
    async ksSetTaxReportCurrencyConfig() {
        var self = this;

        Object.entries(self.ks_report_lines).forEach(([v, k]) => {
            var ksFormatConfigurations = {
                currency_id: k.company_currency_id,
                noSymbol: true,
            };
            k.ks_net_amount = self.ksFormatCurrencySign(k.ks_net_amount, ksFormatConfigurations, k.ks_net_amount < 0 ? '-' : '');
            k.tax = self.ksFormatCurrencySign(k.tax, ksFormatConfigurations, k.tax < 0 ? '-' : '');

            for (const prop in k.balance_cmp) {
                k.balance_cmp[prop][0]['ks_com_net'] = self.ksFormatCurrencySign(k.balance_cmp[prop][0]['ks_com_net'], ksFormatConfigurations, k.balance_cmp[prop][0]['ks_com_net'] < 0 ? '-' : '');
                k.balance_cmp[prop][1]['ks_com_tax'] = self.ksFormatCurrencySign(k.balance_cmp[prop][1]['ks_com_tax'], ksFormatConfigurations, k.balance_cmp[prop][1]['ks_com_tax'] < 0 ? '-' : '');
            }
        });
    }
    async ksSetExecutiveReportCurrencyConfig() {
        var self = this;

        Object.entries(self.ks_report_lines).forEach(([v, k]) => {
            var ksFormatConfigurations = {
                currency_id: k.company_currency_id,
                noSymbol: true,
            };

            for (const prop in k.debit) {
                k.debit[prop] = self.ksFormatCurrencySign(k.debit[prop], ksFormatConfigurations, k.debit[prop] < 0 ? '-' : '');
            }
            for (const prop in k.credit) {
                k.credit[prop] = self.ksFormatCurrencySign(k.credit[prop], ksFormatConfigurations, k.credit[prop] < 0 ? '-' : '');
            }

            //  changed the values of balance
            if (!k['percentage']) {
                for (const prop in k.balance) {
                    k.balance[prop] = self.ksFormatCurrencySign(k.balance[prop], ksFormatConfigurations, k.balance[prop] < 0 ? '-' : '');
                }
            } else {
                for (const prop in k.balance) {
                    k.balance[prop] = String(formatFloat(k.balance[prop])) + "%";
                }
            }

            for (const prop in k.balance_cmp) {
                k.balance_cmp[prop] = self.ksFormatCurrencySign(k.balance_cmp[prop], ksFormatConfigurations, k.balance[prop] < 0 ? '-' : '');
            }
        });
    }

    async ksRenderExecutiveSummary(result) {
        var self = this;

        if (parseFloat(String(result.ks_initial_balance)) > 0 || parseFloat(String(result.ks_current_balance)) > 0 || parseFloat(String(result.ks_ending_balance)) > 0) {
            this.props.showesreport = true

        } else {
            this.props.showesreport = false
        }

    }

    ksFormatCurrencySign(amount, ksFormatConfigurations, sign) {
        var currency_id = ksFormatConfigurations.currency_id;
        currency_id = session.currencies[currency_id];
        var without_sign = formatMonetary(Math.abs(amount), {}, ksFormatConfigurations);
        if (!amount) {
            return '-'
        };
        if (currency_id) {
            if (currency_id.position === "after") {
                return sign + '' + without_sign + '' + currency_id.symbol;
            } else {
                return currency_id.symbol + '' + sign + '' + without_sign;
            }
        }
        return without_sign;
    }
    async ksRenderConsolidateJournal() {
        var self = this;

        Object.entries(self.ks_partner_dict).forEach(([v, k]) => {
            var ksFormatConfigurations = {
                currency_id: k.company_currency_id,
                noSymbol: true,
            };
            k.debit = self.ksFormatCurrencySign(k.debit, ksFormatConfigurations, k.debit < 0 ? '-' : '');
            k.credit = self.ksFormatCurrencySign(k.credit, ksFormatConfigurations, k.credit < 0 ? '-' : '');
            k.balance = self.ksFormatCurrencySign(k.balance, ksFormatConfigurations, k.balance < 0 ? '-' : '')

        });
        this.props.ks_report_lines = self.ks_report_lines,
            this.props.ks_month_lines = self.ks_month_lines
    }


    async OnPrintPdf() {
        var self = this;
        this.orm.call("ks.dynamic.financial.reports", 'ks_get_dynamic_fin_info', [this.props.action.context.id, this.ks_df_report_opt, 0, 200], {
            context: this.props.action.context
        }).then((data) => {
            var report_name = self.ksGetReportName();
            var action = self.ksGetReportAction(report_name, data);
            return self.action.doAction(action);
        });
    }
    async ksPrintReportXlsx() {

        var self = this;
        this.orm.call("ks.dynamic.financial.reports", 'ks_print_xlsx', [this.props.action.context.id, this.ks_df_report_opt], {
            context: this.props.action.context
        }).then((data) => {
            return self.action.doAction(data);
        });

    }

    ksGetReportName() {
        var self = this;
        if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_tb_action')) {
            return 'ks_dynamic_financial_report.ks_account_report_trial_balance';
        } else if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_gl_action')) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_general_ledger';
        } else if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_pl_action')) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_partner_ledger';
        } else if (self.props.action.xml_id == _t("ks_dynamic_financial_report.ks_df_rec_action")) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_age_receivable';
        } else if (self.props.action.xml_id == _t("ks_dynamic_financial_report.ks_df_pay_action")) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_age_payable';
        } else if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_cj_action')) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_consolidate_journal';
        } else if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_tax_report_action')) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_tax_report';
        } else if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_es_action')) {
            return 'ks_dynamic_financial_report.ks_df_executive_summary';
        } else {
            return 'ks_dynamic_financial_report.ks_account_report_lines';
        }
    }
    async ksReportSendEmail(e) {
        e.preventDefault();
        var self = this;
        this.orm.call("ks.dynamic.financial.reports", 'ks_get_dynamic_fin_info', [this.props.action.context.id, this.ks_df_report_opt, 0, 200], {
            context: this.props.action.context
        }).then((data) => {
            var ks_report_action = self.ksGetReportActionName();
            this.orm.call("ks.dynamic.financial.reports", 'ks_action_send_email', [this.props.action.context.id, data, ks_report_action], {
                context: data['context']

            })
            this.notificationService.add(_t("Email Sent!"), { type: 'success' });

        });

    }
    ksGetReportActionName() {
        var self = this;

        if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_tb_action')) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_trial_bal_action';
        } else if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_gl_action')) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_gel_bal_action';
        } else if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_pl_action')) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_partner_led_action';
        } else if (self.props.action.xml_id == _t("ks_dynamic_financial_report.ks_df_rec_action")) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_age_rec_action';
        } else if (self.props.action.xml_id == _t("ks_dynamic_financial_report.ks_df_pay_action")) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_age_pay_action';
        } else if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_cj_action')) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_cons_journal_action';
        } else if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_tax_report_action')) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_tax_action';
        } else if (self.props.action.xml_id == _t('ks_dynamic_financial_report.ks_df_es_action')) {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_executive_action';
        } else {
            return 'ks_dynamic_financial_report.ks_dynamic_financial_report_action';
        }
    }
    ksGetReportAction(report_name, data) {
        var self = this;

        var new_date_format = 'yyyy-M-d';
        //            var dt = new datepicker.DateWidget(options);
        data.ks_df_informations.date.ks_end_date = DateTime.fromISO(data.ks_df_informations.date.ks_end_date).toISODate(new_date_format);
        data.ks_df_informations.date.ks_start_date = DateTime.fromISO(data.ks_df_informations.date.ks_start_date).toISODate(new_date_format);

        if (data['ks_df_informations']['ks_differ']['ks_intervals'].length !== 0) {
            data['ks_df_informations']['ks_differ']['ks_end_date'] = DateTime.fromISO(data['ks_df_informations']['ks_differ']['ks_end_date']).toISODate(new_date_format);
            data['ks_df_informations']['ks_differ']['ks_start_date'] = DateTime.fromISO(data['ks_df_informations']['ks_differ']['ks_start_date']).toISODate(new_date_format);
        }
        return {
            'type': 'ir.actions.report',
            'report_type': 'qweb-pdf',
            'report_name': report_name,
            'report_file': report_name,
            'data': {
                'js_data': data
            },
            'context': {
                'active_model': this.props.action.context.model,
                'landscape': 1,
                'from_js': true,
            },
            'display_name': self.props.action.name,
        };
    }


    async updateFilter(bsFilter) {
        var self = this

        self.ks_df_context.ks_option_enable = false;
        self.ks_df_context.ks_journal_enable = false
        self.ks_df_context.ks_account_enable = false
        self.ks_df_context.ks_account_both_enable = false
        self.ks_df_report_opt.date.ks_filter = bsFilter
        var error = false;
        var new_date_format = 'yyyy-M-d';

        if (bsFilter === 'custom' ) {
            var ks_start_date = ''
            var ks_end_date = ''
            if (this.props.ks_end_date != ''){
                ks_end_date = this.props.ks_end_date.toISODate('yyyy-M-d')
            }
            if (ks_start_date.length > 0) {
                error = ks_start_date.val() === "" || ks_end_date === "";
                self.ks_df_report_opt.date.ks_start_date = DateTime.fromISO(ks_start_date.val()).toISODate(new_date_format);
                self.ks_df_report_opt.date.ks_end_date = ks_end_date;
            } else {
                error = ks_end_date === "";
                if (!error){
                self.ks_df_report_opt.date.ks_end_date = ks_end_date;
                }
            }
        }
        //                if (error) {
        if (error) {

            this.dialogService.add(AlertDialog, {
                title: _t('Odoo Warning'),
                body: _t("Date cannot be empty."),
                confirmLabel: _t('Ok'),
            });
            return
            //                    new WarningDialog(self, {
            //                        title: _t("Odoo Warning"),
            //                    }, {
            //                        message: _t("Date cannot be empty")
            //                    }).open();
        } else {

            const result = await this._ksRenderBody();
            this.setReportValues(result)

        }



    }
    async setReportValues(result){
        this.props.ks_master_value = result
            this.ksSetReportInfo(result);
            this.ks_df_context = result.context
            this.ks_df_report_opt = result['ks_df_informations']
            var ksFormatConfigurations = {
                currency_id: result.ks_currency,
                noSymbol: true,
            };
            this.initial_balance = this.ksFormatCurrencySign(result.ks_initial_balance, ksFormatConfigurations, result.ks_initial_balance < 0 ? '-' : '');
            this.current_balance = this.ksFormatCurrencySign(result.ks_current_balance, ksFormatConfigurations, result.ks_current_balance < 0 ? '-' : '');
            this.ending_balance = this.ksFormatCurrencySign(result.ks_ending_balance, ksFormatConfigurations, result.ks_ending_balance < 0 ? '-' : '');

            this.ks_partner_dict = result['ks_partner_dict']
            this.ks_period_list = result['ks_period_list']
            this.ks_period_dict = result['ks_period_dict']
            this.ks_report_lines = result['ks_report_lines']

            if (this.props.action.xml_id != 'ks_dynamic_financial_report.ks_df_tax_report_action' && this.props.action.xml_id != 'ks_dynamic_financial_report.ks_df_es_action') {
                this.ksSetReportCurrencyConfig();
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_tax_report_action') {
                this.ksSetTaxReportCurrencyConfig();
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_es_action') {
                this.ksSetExecutiveReportCurrencyConfig();
            }



            if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_tax_report_action') {
                this.props.ks_df_report_opt = result['ks_df_informations']
                this.props.ks_report_lines = result['ks_report_lines']
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_rec_action') {
                this.ksRenderAgeReceivable()
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pay_action') {
                this.ksRenderAgePayable()
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_cj_action') {
                this.ksRenderConsolidateJournal()
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_es_action') {
                this.props.ks_df_report_opt = result['ks_df_informations']
                this.props.ks_report_lines = result['ks_report_lines']
                this.ksRenderExecutiveSummary(result)
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_tb_action') {
                this.ks_report_lines = result['ks_report_lines']
                this.ks_retained = result['ks_retained']
                this.ks_subtotal = result['ks_subtotal']
                this.props.ks_report_lines = result['ks_report_lines']
                this.ks_df_report_opt = result['ks_df_informations']
                this.ksRenderTrialBalance();
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_gl_action') {
                this.props.ks_report_lines = result['ks_report_lines']
                this.props.ks_enable_ledger_in_bal = result['ks_enable_ledger_in_bal']
            } else if (this.props.action.xml_id == 'ks_dynamic_financial_report.ks_df_pl_action') {
                this.props.ks_report_lines = result['ks_report_lines']
                this.props.ks_enable_ledger_in_bal = result['ks_enable_ledger_in_bal']
            } else {
                this.props.ks_report_lines = result['ks_report_lines']
                this.props.ks_df_report_opt = result['ks_df_informations']
                this.props.ks_initial_balance = result['ks_initial_balance']
                this.props.ks_current_balance = result['ks_current_balance']
                this.props.ks_ending_balance = result['ks_ending_balance']
                if (parseFloat(String(result.ks_initial_balance)) > 0 || parseFloat(String(result.ks_current_balance)) > 0 || parseFloat(String(result.ks_ending_balance)) > 0) {
                    this.props.showgenreport = true
                } else {
                    this.props.showgenesreport = false
                }
            }
             this.render()
    }
    async ksGetAgedReportDetailedInfo(offset, partner_id) {
            var self = this;
            var lines = await this.orm.call("ks.dynamic.financial.reports", 'ks_process_aging_data', [this.props.action.context.id, self.ks_df_report_opt, offset, partner_id])
            return Promise.resolve(lines);
        }

    async ksGetAgedLinesInfo(event) {
            var ev = event.currentTarget
             $('.o_filter_menu').removeClass('ks_d_block')
            event.preventDefault();


            var self = this;
            var partner_id = $(ev).data('bsPartnerId');
            var offset = 0;
            var td = $(ev).next('tr').find('td');
            if (td.length == 1) {
                self.ksGetAgedReportDetailedInfo(offset, partner_id).then(function (datas) {
                    var count = datas[0];
                    var offset = datas[1];
                    var account_data = datas[2];
                    var period_list = datas[3];
                    Object.entries(self.ks_partner_dict).forEach(([v, k]) => {
                        var ksFormatConfigurations = {
                            currency_id: k.company_currency_id,
                            noSymbol: true,
                        };
                        k.range_0 = self.ksFormatCurrencySign(k.range_0, ksFormatConfigurations, k.range_0 < 0 ? '-' : '');
                        k.range_1 = self.ksFormatCurrencySign(k.range_1, ksFormatConfigurations, k.range_1 < 0 ? '-' : '');
                        k.range_2 = self.ksFormatCurrencySign(k.range_2, ksFormatConfigurations, k.range_2 < 0 ? '-' : '');
                        k.range_3 = self.ksFormatCurrencySign(k.range_3, ksFormatConfigurations, k.range_3 < 0 ? '-' : '');
                        k.range_4 = self.ksFormatCurrencySign(k.range_4, ksFormatConfigurations, k.range_4 < 0 ? '-' : '');
                        k.range_5 = self.ksFormatCurrencySign(k.range_5, ksFormatConfigurations, k.range_5 < 0 ? '-' : '');
                        k.range_6 = self.ksFormatCurrencySign(k.range_6, ksFormatConfigurations, k.range_6 < 0 ? '-' : '');
                        k.date_maturity = DateTime.fromISO(k.date_maturity, { zone: 'utc' });
                    });
                    $(ev).next('tr').find('td .ks_py-mline-table-div').remove();
                    const content = renderToString('ks_df_sub_receivable0', {
                            count: count,
                            self: self,
                            offset: offset,
                            account_data: account_data,
                            period_list: period_list,
                            lang: self.ks_df_context.lang,
                            // ksgetaction: self.ksgetaction(self),
                        })
                    var $content = $(content);
                    console.log("content=====", $content)
                    var check_box = $content.find(`[action]`)
                    console.log("check_box=====", check_box)
                    const get_action = self.ksgetaction.bind(self);
                    check_box.on("click", get_action);
                    // $content.on()
                    $(ev).next('tr').find('td ul').after($content);
                    $(ev).next('tr').find('td ul li:first a').css({
                        'background-color': '#00ede8',
                        'font-weight': 'bold',
                    });
                    self.render()
                })
            }
        }


    async ksGetConsolidateLinesByPage(offset, ks_journal_id) {
            var self = this;
            var lines = await this.orm.call("ks.dynamic.financial.reports", 'ks_consolidate_journals_details', [this.props.action.context.id, offset, ks_journal_id, self.ks_df_report_opt])
            return Promise.resolve(lines);

        }

    async ksGetConsolidateInfo(event) {

            var ev = event.currentTarget
             $('.o_filter_menu').removeClass('ks_d_block')
            event.preventDefault();
            var self = this;
            var ks_journal_id = $(ev).data('bsJournalId');
            var offset = 0;
            var td = $(ev).next('tr').find('td');
            if (td.length == 1) {
                self.ksGetConsolidateLinesByPage(offset, ks_journal_id).then(function (datas) {
                    var offset = datas[0];
                    var account_data = datas[1];
                    Object.entries(account_data).forEach(([v, k]) => {
                        var ksFormatConfigurations = {
                            currency_id: k.company_currency_id,
                            noSymbol: true,
                        };
                        k.debit = self.ksFormatCurrencySign(k.debit, ksFormatConfigurations, k.debit < 0 ? '-' : '');
                        k.credit = self.ksFormatCurrencySign(k.credit, ksFormatConfigurations, k.credit < 0 ? '-' : '');
                        k.balance = self.ksFormatCurrencySign(k.balance, ksFormatConfigurations, k.balance < 0 ? '-' : '');
                        k.ldate = DateTime.fromISO(k.ldate, { zone: 'utc' });
                    });
                    $(ev).next('tr').find('td .ks_py-mline-table-div').remove();
                    const content = renderToString('ks_df_cj_subsection', {
                            offset: offset,
                            self: self,
                            account_data: account_data,
                            ks_debit_credit_visibility: self.ks_df_report_opt['ks_diff_filter']['ks_debit_credit_visibility'],
                            lang: self.ks_df_context.lang,
                        })
                    var $content = $(content);
                    var check_box = $content.find(`[action]`)
                    const get_action = self.ksgetaction.bind(self);
                    check_box.on("click", get_action);
                    $(ev).next('tr').find('td ul').after($content)
                    $(ev).next('tr').find('td ul li:first a').css({
                        'background-color': '#00ede8',
                        'font-weight': 'bold',
                    });
                })
            }
        }




    async ksGetGlLineByPage(offset, account_id) {
            var self = this;
            var lines = await this.orm.call("ks.dynamic.financial.reports", 'ks_build_detailed_gen_move_lines', [this.props.action.context.id, offset, account_id, self.ks_df_report_opt])
            return Promise.resolve(lines);
        }


        async ksGetMoveLines(event) {

            var ev = event.currentTarget
            event.preventDefault();

            $('.o_filter_menu').removeClass('ks_d_block')
            var self = this;
            var account_id = $(ev).data('bsAccountId');
            var offset = 0;
            var td = $(ev).next('tr').find('td');

            if (td.length == 1) {
                self.ksGetGlLineByPage(offset, account_id).then(function (datas) {
                    Object.entries(datas[2]).forEach(([v, k]) => {
                        var ksFormatConfigurations = {
                            currency_id: k.company_currency_id,
                            noSymbol: true,
                        };
                        k.debit = self.ksFormatCurrencySign(k.debit, ksFormatConfigurations, k.debit < 0 ? '-' : '');
                        k.credit = self.ksFormatCurrencySign(k.credit, ksFormatConfigurations, k.credit < 0 ? '-' : '');
                        k.balance = self.ksFormatCurrencySign(k.balance, ksFormatConfigurations, k.balance < 0 ? '-' : '');
                        k.initial_balance = self.ksFormatCurrencySign(k.initial_balance, ksFormatConfigurations, k.initial_balance < 0 ? '-' : '');
                        k.ldate = DateTime.fromISO(k.ldate, { zone: 'utc' });
                    });
                    $(ev).next('tr').find('td .ks_py-mline-table-div').remove();
                    const content = renderToString('ks_df_gl_subsection', {
                            count: datas[0],
                            self: self,
                            offset: datas[1],
                            ks_debit_credit_visibility: self.ks_df_report_opt['ks_diff_filter']['ks_debit_credit_visibility'],
                            account_data: datas[2],
                            ks_enable_ledger_in_bal: self.ks_enable_ledger_in_bal,
                        })
                    var $content = $(content);
                    var check_box = $content.find(`[action]`)
                    const get_action = self.ksgetaction.bind(self);
                    check_box.on("click", get_action);
                    $(ev).next('tr').find('td ul').after($content)
                    $(ev).next('tr').find('td ul li:first a').css({
                        'background-color': '#00ede8',
                        'font-weight': 'bold',
                    });
                })
            }
        }




    async ksGetPlLinesByPage(offset, account_id) {
            var self = this;
            var lines = await this.orm.call("ks.dynamic.financial.reports", 'ks_build_detailed_move_lines', [this.props.action.context.id, offset, account_id, self.ks_df_report_opt, self.$ks_searchview_buttons.find('.ks_search_account_filter').length])
            return Promise.resolve(lines);

        }

    async ksGetPlMoveLines(event) {

            var ev = event.currentTarget
             $('.o_filter_menu').removeClass('ks_d_block')

            event.preventDefault();
            var self = this;
            var account_id = $(ev).data('bsAccountId');
            var offset = 0;
            var td = $(ev).next('tr').find('td');
            if (td.length == 1) {
                self.ksGetPlLinesByPage(offset, account_id).then(function (datas) {
                     Object.entries(datas[2]).forEach(([v, k]) => {
                        var ksFormatConfigurations = {
                            currency_id: k.company_currency_id,
                            noSymbol: true,
                        };
                        k.debit = self.ksFormatCurrencySign(k.debit, ksFormatConfigurations, k.debit < 0 ? '-' : '');
                        k.credit = self.ksFormatCurrencySign(k.credit, ksFormatConfigurations, k.credit < 0 ? '-' : '');
                        k.balance = self.ksFormatCurrencySign(k.balance, ksFormatConfigurations, k.balance < 0 ? '-' : '');
                        k.initial_balance = self.ksFormatCurrencySign(k.initial_balance, ksFormatConfigurations, k.initial_balance < 0 ? '-' : '');
                        k.ldate = DateTime.fromISO(k.ldate, { zone: 'utc' });
                    });
                    $(event.currentTarget).next('tr').find('td .ks_py-mline-table-div').remove();
                    const content = renderToString('ks_df_sub_pl0', {
                            count: datas[0],
                            self: self,
                            offset: datas[1],
                            account_data: datas[2],
                            ks_debit_credit_visibility: self.ks_df_report_opt['ks_diff_filter']['ks_debit_credit_visibility'],
                            ks_enable_ledger_in_bal: self.ks_enable_ledger_in_bal,
                            lang: self.ks_df_context.lang
                        })
                    var $content = $(content);
                    var check_box = $content.find(`[action]`)
                    const get_action = self.ksgetaction.bind(self);
                    check_box.on("click", get_action);
                    $(ev).next('tr').find('td ul').after($content)
                    $(ev).next('tr').find('td ul li:first a').css({
                        'background-color': '#00ede8',
                        'font-weight': 'bold',
                    });
                })
            }
        }

        async OnClickDate(bsFilter) {

                var self=this
                console.log(bsFilter);
                var option_value = bsFilter;
                self.ks_df_report_opt.print_detailed_view = false;
                self.ks_df_context.ks_option_enable = false;
                self.ks_df_context.ks_journal_enable = false
                self.ks_df_context.ks_account_enable = false
                self.ks_df_context.ks_account_both_enable = false
                var ks_options_enable = false
                if (!$(event.currentTarget).hasClass('selected')){
                    var ks_options_enable = true
                    if(option_value == 'ks_report_with_lines' && !self.ks_df_context.print_detailed_view){
                    self.ks_df_report_opt.print_detailed_view = true;
                    }
                }
                var ks_temp_arr = []
                var ks_options = $(event.currentTarget)
                for (var i=0; i < ks_options.length; i++){
                    if (ks_options[i].dataset.filter !== option_value){
                        ks_temp_arr.push($(ks_options[i]).hasClass('selected'))
                    }
                }
                if (ks_temp_arr.indexOf(true) !== -1 || ks_options_enable){
                    self.ks_df_context.ks_option_enable = true;
                }else{
                    self.ks_df_context.ks_option_enable = false;
                }

                if(option_value=='ks_hide_debit_credit'){
                    var ks_hide_debit_credit = {}
                    ks_hide_debit_credit['ks_debit_credit'] = !self.ks_df_report_opt['ks_diff_filter'][option_value]
                    // this.ks_hide_debit_credit = !this.ks_hide_debit_credit;
                    // if (!this.ks_hide_debit_credit){
                    //     this.props.ks_df_report_opt['ks_diff_filter']['ks_debit_credit_visibility'] = false;
                    // }
                    if (['Age Payable', 'Age Receivable'].includes(this.props.ks_master_value.new_ks_df_reports_ids)){
                        return await this.orm.call("ks.dynamic.financial.reports", 'write', [this.props.action.context.id, ks_hide_debit_credit], {
                            context: this.props.action.context
                        }).then((data) => {
                            this.orm.call("ks.dynamic.financial.reports", 'ks_reload_page').then((data) => {
                                return self.action.doAction(data);
                            });
                        });
                    } else {
                        self.ks_df_report_opt.ks_diff_filter.ks_debit_credit_visibility = !self.ks_df_report_opt.ks_diff_filter.ks_debit_credit_visibility;
                        this.render();
                    }
                }
                if(option_value=='ks_comparison_range'){
                    var ks_date_range_change = {}
                    ks_date_range_change['ks_comparison_range'] =!self.ks_df_report_opt[option_value]
                    return await this.orm.call("ks.dynamic.financial.reports", 'write', [this.props.action.context.id, ks_date_range_change], {
                        context: this.props.action.context
                    }).then((data) => {
                        this.orm.call("ks.dynamic.financial.reports", 'ks_reload_page').then((data) => {
                            return self.action.doAction(data);
                        });
                    });

                }
                else if(option_value!='ks_comparison_range'){
                    self.ks_df_report_opt[option_value]= !self.ks_df_report_opt[option_value]
                }
                if (option_value === 'unfold_all') {
                    self.unfold_all(self.ks_df_report_opt[option_value]);
                }
                const result = await this._ksRenderBody();
                this.setReportValues(result)
            }

        async OnChangeComp(bsFilter) {

                var self = this

                self.ks_df_context.ks_option_enable = false;
                self.ks_df_context.ks_journal_enable = false
                self.ks_df_context.ks_account_enable = false
                self.ks_df_context.ks_account_both_enable = false
                self.ks_df_report_opt.ks_differ.ks_differentiate_filter = bsFilter;
                if (self.ks_df_report_opt.ks_differ.ks_differentiate_filter == "no_differentiation") {
                    self.ks_df_report_opt.ks_diff_filter.ks_diff_filter_enablity = false
                    self.ks_df_report_opt.ks_diff_filter.ks_debit_credit_visibility = true
                }
                if (self.ks_df_report_opt.ks_differ.ks_differentiate_filter != "no_differentiation") {
                    self.ks_df_report_opt.ks_diff_filter.ks_diff_filter_enablity = true
                    self.ks_df_report_opt.ks_diff_filter.ks_debit_credit_visibility = false
                }
                var error = false;
                var number_period = $(event.currentTarget).parent().parent().find('input[name="periods_number"]')
                self.ks_df_report_opt.ks_differ.ks_no_of_interval = (number_period.length > 0) ? parseInt(number_period.val()) : 1;
                if(this.props.date_from_cmp.toISODate==''){
                    error = true;
                }
                if (bsFilter === 'custom') {
                    var ks_start_date = '';
                    var ks_end_date = '';
                    if (this.props.date_from_cmp != ''){
                        ks_start_date = this.props.date_from_cmp.toISODate('yyyy-M-d')
                    }
                    if (this.props.date_to_cmp != ''){
                        ks_end_date = this.props.date_to_cmp.toISODate('yyyy-M-d')
                    }

                    if (ks_start_date.length > 0) {
                        error = ks_start_date === "" || ks_end_date === "";
                        self.ks_df_report_opt.ks_differ.ks_start_date = ks_start_date;
                        self.ks_df_report_opt.ks_differ.ks_end_date = ks_end_date;
                    } else {
                        error = ks_end_date === "";
                        if (!error){
                        self.ks_df_report_opt.ks_differ.ks_end_date = ks_end_date;
                        }
                    }
                }
//                if (error) {
                if (error) {
                this.dialogService.add(AlertDialog, {
                title: _t('Odoo Warning'),
                body: _t("Date cannot be empty."),
                confirmLabel: _t('Ok'),
                 });
                 return
//                    new WarningDialog(self, {
//                        title: _t("Odoo Warning"),
//                    }, {
//                        message: _t("Date cannot be empty")
//                    }).open();
                } else {
                    const result = await self._ksRenderBody();
                    this.setReportValues(result)
                }
            }

        async js_account_report_group_choice_filter(bsFilter,bsMemberIds) {
                var option_value = bsFilter;
                var option_member_ids = bsMemberIds || [];
                var is_selected = $(this).hasClass('selected');
                Object.entries(self.ks_df_report_opt[option_value]).forEach((el) => {
                    // if group was selected, we want to uncheck all
                    el.selected = !is_selected && (option_member_ids.indexOf(Number(el.id)) > -1);
                });
                const result = await self._ksRenderBody();
                this.setReportValues(result)
            }
        async js_account_report_choice_filter(bsId,bsFilter) {
                var self = this
                self.ks_df_context.ks_journal_enable = false
                self.ks_df_context.ks_account_enable = false
                self.ks_df_context.ks_account_both_enable = false

                self.ks_df_context.ks_option_enable = false;

                var option_value = bsFilter;
                var option_id = bsId;

                if (!$(event.currentTarget).hasClass('selected')){
                    var ks_options_enable = true
                }
                var ks_temp_arr = []
                var ks_options = $(event.currentTarget).find('a')
                for (var i=0; i < ks_options.length; i++){
                    if (parseInt(ks_options[i].dataset.bsId) !== option_id){
                        ks_temp_arr.push($(ks_options[i]).hasClass('selected'))
                    }
                }
                if (option_value === 'account'){
                    if (ks_temp_arr.indexOf(true) !== -1 || ks_options_enable){
                        self.ks_df_context.ks_account_enable = true;
                    }
                }
                if (option_value === 'journals'){
                    if (ks_temp_arr.indexOf(true) !== -1 || ks_options_enable){
                        self.ks_df_context.ks_journal_enable = true;
                    }
                }
                if (option_value === 'account_type'){
                    if (ks_temp_arr.indexOf(true) !== -1 || ks_options_enable){
                        self.ks_df_context.ks_account_both_enable = true;
                    }
                }

//
                self.ks_df_report_opt[option_value].filter((el) => {
                if ('' + el.id == '' + option_id) {
                    if (el.selected === undefined || el.selected === null) {
                        el.selected = false;
                    }
                    el.selected = !el.selected;
                } else if (option_value === 'ir_filters') {
                    el.selected = false;
                }
                return el;
            });

                const result = await self._ksRenderBody();
                this.setReportValues(result)
            }


        async ksgetaction(event) {
            console.log("evnt====", event)

            event.stopPropagation();
            var self = this;
            var action = $(event.target).attr('action');
            var id = $(event.target).parents('td').data('bsAccountId') || $(event.target).parents('td').data('bsMoveId');
            var params = $(event.target).data();
            console.log("action====", action)
            console.log("props====", this.props.action.context)
            console.log("ks_df_report_opt====", this.ks_df_report_opt)
            console.log("params====", params)
//            var context = new Context(this.ks_df_context, {}, {
//                active_id: id
//            });

//            params = _.omit(params, 'actionContext');
            if (action) {
                this.orm.call(
                    'ks.dynamic.financial.reports', 
                    action, 
                    [this.props.action.context.id, this.ks_df_report_opt, params], 
                    {context:this.props.action.context}
                ).then((result) => {
                    return self.action.doAction(result);
                });

            }
        }
        getMultiRecordSelectorProps(resModel, optionKey) {
            return {
                resModel,
                resIds:this.ks_df_report_opt.ks_partner_ids,
                onValueChanged: (event) => {
                    this.ksPerformOnchange(event);
                },
            };
    }

    getMultiRecordSelectoraccount(resModel, optionKey) {
        return {
            resModel,
            resIds:this.ks_df_report_opt.analytic_accounts || [],
            onValueChanged: (event) => {
                this.ksPerformOnchangeaccount(event);

            },

        };
    }
    async ksPerformOnchange(ev){
            await this._ksPerformOnchange(ev)
            this.render()
    }
    async _ksPerformOnchange(ev){
            var self = this;
            console.log("ev=====", ev);
            var partner_ids = [];
            for(let i=0; i<ev.length; i++){
                console.log("ev=====", ev[i])
                partner_ids.push(ev[i]);
            }
            console.log("ev=====", partner_ids);
            self.ks_df_report_opt.ks_partner_ids = ev;
//            self.ks_df_report_opt.analytic_accounts = ev.data.ks_analytic_ids;
//            self.ks_df_report_opt.analytic_tags = ev.data.ks_analytic_tag_ids;
            const result = await this._ksRenderBody();
            this.props
            this.setReportValues(result)
        }
    async ksPerformOnchangeaccount(ev){
            await this._ksPerformOnchangeaccount(ev)
            this.render()
    }
    async _ksPerformOnchangeaccount(ev){
            var self = this;
//            self.ks_df_report_opt.ks_partner_ids = ev;
            self.ks_df_report_opt.analytic_accounts = ev;
            const result = await this._ksRenderBody();
            this.setReportValues(result)


        }
}

ksDynamicReportsWidget.components = {
    KsControlPanel,
    DropdownItem,
    Dropdown,
    DateTimePicker,
    DatePicker, 
    KsRecordsSelector,
    Pager,
    // MultiRecordSelector
};
ksDynamicReportsWidget.customizableComponents = {

};
// ksDynamicReportsWidget.props = {
//     searchViewFields: {
//         date: {
//             name: "date",
//             string: "Date",
//             type: "date",
//             store: true,
//             sortable: true,
//             searchable: true,
//         },
//         stage_id: {
//             name: "stage_id",
//             string: "Stage",
//             type: "many2one",
//             store: true,
//             sortable: true,
//             searchable: true,
//         },
//     },
// };
ksDynamicReportsWidget.template = "ks_tax_report_lines";

registry.category("actions").add('ks_dynamic_report', ksDynamicReportsWidget);

// return ksDynamicReportsWidget;

//});


$(document).ready(function() {
    $(document).on('click', 'header .o_main_navbar', function(evt) {
        $('.o_filter_menu').removeClass('ks_d_block')
    });
});
















