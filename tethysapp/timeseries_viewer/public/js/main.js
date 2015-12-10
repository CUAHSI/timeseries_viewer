
function find_query_parameter(name) {
  url = location.href;
  //name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( url );
  return results == null ? null : results[1];
}


// here we set up the configuration of the highCharts chart


// here we set up the configuration of the highCharts chart
var chart_options = {
	chart: {

		zoomType: 'x',
		resetZoomButton: {
            position: {
            // align: 'right', // by default
            // verticalAlign: 'top', // by default
                x: 0,
                y: 35
            }
        }
	},
    exporting:{
        buttons:{
            contextButton:{
                text: 'print / export chart',
                symbol: 'url(/static/timeseries_viewer/images/print16.png)'
            }
        },
        chartOptions:{
            legend:{
                borderWidth: 0
            }
        },
        sourceWidth: 1200,
        sourceHeight: 600
    },
	title: {
		text: ''
	},
	xAxis: {
		type: 'datetime',
        lineWidth:2,
        lineColor: 'lightgray'
	},
	yAxis: {
		title: {
			text: 'Data Value',

		},
        lineWidth:2,
        lineColor: 'lightgray'
	},
	legend: {
		align: 'center',
        itemStyle:{
            fontWeight: 'bold',
            fontSize: '17px'
        },
        title: {text:'Legend'},
        borderColor: '#C98657',
        borderWidth: 1
	},
	plotOptions: {
		line: {
			color: Highcharts.getOptions().colors[0],
			marker: {
				radius: 2
			},
            size:'100%',
			lineWidth: 1,
			states: {
				hover: {
					lineWidth: 1
				}
			},
			threshold: null
		}
	}
};

// shows an error message in the chart title
function show_error(chart, error_message) {
    chart.legend.group.hide();
    var button = chart.exportSVGElements[0];
    button.destroy();
    chart.hideLoading();
    $('#metadata-loading').hide();
    console.log(error_message);
    $('#error-message').text(error_message);
    chart.setTitle({ text: "" });
}

function add_series_to_chart(chart, res_id) {

    current_url = location.href;
    index = current_url.indexOf("timeseries-viewer");
    base_url = current_url.substring(0, index);

    // in the start we show the loading...
    chart.showLoading();
    $('#metadata-loading').show();

    data_url = base_url + 'timeseries-viewer/chart_data/' + res_id + '/';
    $.ajax({
        url: data_url,
        success: function(json) {

            // first of all check for the status
            var status = json.status;
            if (status !== 'success') {
                show_error(chart, "Error loading time series from " + res_id + ": " + status)
                return;
            }

            var series = {
            id: res_id,
            name: json.site_name + ' ' + json.variable_name,
            data: []
            }

            // add the time series to the chart
            series.data = json.for_highchart;
            chart.addSeries(series);

            // set the y axis title and units
            var units = json.units;
            if(units==null) {
                units = "";
            }
            chart.yAxis[0].setTitle({ text: json.variable_name + ' ' + units });

            // now we can hide the loading... indicator
            chart.hideLoading();

            // if we have values more than threshold, show title
            if (json.count >= 50000) {
                chart.setTitle({text: 'Showing first 50000 values'})
            }

            // prepare data for the metadata display
            var site_name = json.site_name
            var variable_name = json.variable_name
            var organization = json.organization
            var quality = json.quality
            var method = json.method
            var datatype = json.datatype
            var valuetype = json.valuetype
            var samplemedium = json.samplemedium

            if(site_name==null){
                site_name = "N/A"
            }
            if(variable_name==null){
                variable_name= "N/A"
            }
            if(organization==null){
                organization= "N/A"
            }
            if(quality==null){
                quality= "N/A"
            }
            if(method==null){
                method= "N/A"
            }
            if(datatype==null){
                datatype= "N/A"
            }
            if(valuetype==null){
                valuetype= "N/A"
            }
            if(samplemedium==null){
                samplemedium= "N/A"
            }

            // set the metadata elements content
            var metadata_info =

             "<b>Site: </b>"+site_name +"<br>"+
             "<b>Variable: </b>"+variable_name +"<br>"+
             "<b>Organization: </b>"+organization +"<br>"+
             "<b>Quality: </b>"+quality +"<br>"+
             "<b>Method: </b>"+method +"<br>"+
             "<b>Data Type: </b>"+datatype +"<br>"+
             "<b>Value Type: </b>"+valuetype +"<br>"+
             "<b>Sample Medium: </b>"+samplemedium


            $('#metadata-list').append(metadata_info);
            $('#metadata-loading').hide();

            // add the row to the statistics table
            var stats_info = "<tr>" +
            "<td>" + json.site_name + "</td>" +
            "<td>" + json.count + "</td>" +
            "<td>" + json.mean + "</td>" +
            "<td>" + json.median + "</td>" +
            "<td>" + json.stdev.toFixed(4) + "</td></tr>";

            $("#stats-table").append(stats_info);
        },
        error: function() {
            show_error("Error loading time series from " + res_id);
        }
    });
}

var popupDiv = $('#welcome-popup');

$(document).ready(function () {

    $('#metadata-loading').hide();

    var res_id = find_query_parameter("res_id");

    if (res_id == null) {
        popupDiv.modal('show');
    }

    // initialize the chart and set chart height
    var page_height = $(document).height();
    if (page_height > 500) {
        chart_options.chart.height = page_height - 225;
    }

    $('#ts-chart').highcharts(chart_options);

    // add the series to the chart
    var chart = $('#ts-chart').highcharts();
    add_series_to_chart(chart, res_id);

    // change the app title
    document.title = 'Time Series Viewer';

    // force to adjust chart width when user hides or shows the side bar
    $("#app-content").on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(event) {
        if (event.originalEvent.propertyName == 'padding-right') {
            $(window).resize(); // this forces the chart to redraw
        }
    });
})