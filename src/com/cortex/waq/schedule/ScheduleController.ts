import ListComponent from "../../core/component/ListComponent";
import ComponentEvent from "../../core/component/event/ComponentEvent";
import ComponentBinding from "../../core/component/ComponentBinding";
import MouseTouchEvent from "../../core/mouse/event/MouseTouchEvent";

import MVCEvent from "../../core/mvc/event/MVCEvent";
import EventDispatcher from "../../core/event/EventDispatcher";
import AbstractView from "../../core/mvc/AbstractView";

import Conference from "../conference/data/Conference";
import SubjectType from "../conference/data/SubjectType";
import ConferenceModel from "../conference/ConferenceModel";
import SubjectTypeModel from "../conference/SubjectTypeModel";

export default class ScheduleController extends EventDispatcher {

	private mScheduleView:AbstractView;

	private mListComponent:ListComponent;
	private mConferenceModel:ConferenceModel;
	private mSubjectTypeModel:SubjectTypeModel;

	private mDayFilters:Array<number>;
	private mTypeFilters:Array<SubjectType>;

	private mEventDays:Array<number> = [6,7,8];

	constructor() {

		super();

		this.Init();
	}

	public Init():void {

		this.mSubjectTypeModel = SubjectTypeModel.GetInstance();

		this.mConferenceModel = ConferenceModel.GetInstance();
		this.mConferenceModel.AddEventListener(MVCEvent.JSON_LOADED, this.OnJSONLoaded, this);
		this.mConferenceModel.FetchConferences();
	}

	public Destroy():void {

		var scheduleHTMLElement:HTMLElement = document.getElementById("schedule-view");
		document.getElementById("content-current").removeChild(scheduleHTMLElement);

		this.mListComponent.Destroy();
		this.mListComponent = null;

		this.mScheduleView.Destroy();
		this.mScheduleView = null;
	}

	private OnJSONLoaded(aEvent:MVCEvent):void {

		this.mConferenceModel.RemoveEventListener(MVCEvent.JSON_LOADED, this.OnJSONLoaded, this);

		this.mDayFilters = new Array<number>();
		this.mTypeFilters = this.mSubjectTypeModel.GetSubjectTypes().slice(0, this.mSubjectTypeModel.GetSubjectTypes().length);

		this.mScheduleView = new AbstractView();
		this.mScheduleView.AddEventListener(MVCEvent.TEMPLATE_LOADED, this.OnTemplateLoaded, this);
		this.mScheduleView.LoadTemplate("templates/schedule/schedule.html");
	}

	private OnTemplateLoaded(aEvent:MVCEvent):void {

		this.mScheduleView.RemoveEventListener(MVCEvent.TEMPLATE_LOADED, this.OnTemplateLoaded, this);

		var subjectTypes = this.mSubjectTypeModel.GetSubjectTypes();

		document.getElementById("content-loading").innerHTML += this.mScheduleView.RenderTemplate({subjectTypes:subjectTypes});

		this.mScheduleView.AddEventListener(MouseTouchEvent.TOUCHED, this.OnScreenClicked, this);

		var eventDaysLength = this.mEventDays.length;

		for(var i:number = 0; i < eventDaysLength; i++){

			this.mScheduleView.AddClickControl(document.getElementById("schedule-btn-"+ this.mEventDays[i]));
		}

		var subjectTypesLength = subjectTypes.length;

		for(i = 0; i < subjectTypesLength; i++){

			this.mScheduleView.AddClickControl(document.getElementById("tag-"+ subjectTypes[i].subjectSlug));
		}

		this.mScheduleView.AddClickControl(document.getElementById("schedule-option"));

		this.mListComponent = new ListComponent();
		this.mListComponent.Init("schedule-content");

		this.GenerateConferences();

		this.DispatchEvent(new MVCEvent(MVCEvent.TEMPLATE_LOADED));
	}

	private GenerateConferences():void {

		var conferences:Array<Conference> = this.mConferenceModel.GetConferences();

		var max:number = conferences.length;

		for (var i:number = 0; i < max; i++) {

			this.mListComponent.AddComponent(new ComponentBinding(new AbstractView(), conferences[i]));
		}

		this.mListComponent.AddEventListener(ComponentEvent.ALL_ITEMS_READY, this. OnConferenceTemplateLoaded, this);
		this.mListComponent.LoadWithTemplate("templates/conference/conference.html");
	}

	private ShowOptionMenu():void{

		var menu:HTMLElement = document.getElementById("schedule-menu-option");
		var content:HTMLElement = document.getElementById("schedule-content-wrapper");

		var scheduleButton1:HTMLElement = document.getElementById("schedule-btn-6");
		var scheduleButton2:HTMLElement = document.getElementById("schedule-btn-7");
		var scheduleButton3:HTMLElement = document.getElementById("schedule-btn-8");
		var scheduleButtonOption:HTMLElement = document.getElementById("schedule-option");

		if(menu.classList.contains("schedule-menu-option-shown")){

			scheduleButton1.classList.remove("schedule-btn-date-hidden");
			scheduleButton2.classList.remove("schedule-btn-date-hidden");
			scheduleButton3.classList.remove("schedule-btn-date-hidden");
			scheduleButtonOption.classList.remove("schedule-btn-option-full");
			menu.classList.remove("schedule-menu-option-shown");
			content.classList.remove("hidden");

		} else {

			scheduleButton1.classList.add("schedule-btn-date-hidden");
			scheduleButton2.classList.add("schedule-btn-date-hidden");
			scheduleButton3.classList.add("schedule-btn-date-hidden");
			scheduleButtonOption.classList.add("schedule-btn-option-full");

			//scheduleButtonOption.textContent = "<--"
			menu.classList.add("schedule-menu-option-shown");
			content.classList.add("hidden");
		}
	}

	private FilterEventByType(aSubjectType:SubjectType):void{

		var filterIndex:number = this.mTypeFilters.indexOf(aSubjectType);

		var button:HTMLElement = document.getElementById("tag-" + aSubjectType.subjectSlug);

		if(filterIndex < 0) {

			this.mTypeFilters.push(aSubjectType);
			button.classList.add("tag-on");
			button.classList.remove("tag-off");

		} else {

			this.mTypeFilters.splice(filterIndex, 1);
			button.classList.remove("tag-on");
			button.classList.add("tag-off");
		}

		this.RenderFilteredEvent();
	}

	private FilterEventByDate(aDay:number):void{

		var button:HTMLElement;

		if(this.mDayFilters.length > 0) {

			button = document.getElementById("schedule-btn-" + this.mDayFilters.pop());
			button.classList.remove("selected");
			button.classList.add("schedule-btn-date");
		}

		this.mDayFilters.push(aDay);
		button  = document.getElementById("schedule-btn-" + aDay);
		button.classList.add("selected");
		button.classList.remove("schedule-btn-date");

		this.RenderFilteredEvent();
	}

	private RenderFilteredEvent():void {

		this.mListComponent.RemoveAllComponents();

		var componentBindings:Array<ComponentBinding> = this.mListComponent.GetComponentBindings();

		var componentBindingsLength:number = componentBindings.length;

		for(var i:number = 0; i < componentBindingsLength; i++){

			var componentBinding:ComponentBinding = componentBindings[i];
			var conference:Conference = <Conference>componentBinding.Data;

			for(var j:number = 0, dayFiltersLength = this.mDayFilters.length; j < dayFiltersLength; j++){

				if(conference.timeSlot.day == this.mDayFilters[j]) {

					for(var k:number = 0, typeFiltersLength = this.mTypeFilters.length; k < typeFiltersLength; k++) {

						if(conference.subjectType == this.mTypeFilters[k]){
							this.mListComponent.AddComponent(componentBinding);
							break;
						}
					}
					break;
				}
			}
		}
	}

	private OnConferenceTemplateLoaded(aEvent:ComponentEvent):void {

		this.mListComponent.RemoveEventListener(ComponentEvent.ALL_ITEMS_READY, this. OnConferenceTemplateLoaded, this);

		var componentBindings:Array<ComponentBinding> = this.mListComponent.GetComponentBindings();

		var componentBindingsLength:number = componentBindings.length;

		for(var i:number = 0; i < componentBindingsLength; i++){

			var componentBinding:ComponentBinding = componentBindings[i];

			componentBinding.HTML = document.getElementById("conference-view-" + componentBinding.Data.ID);

			this.mScheduleView.AddClickControl(componentBinding.HTML);
		}

		this.FilterEventByDate(this.mEventDays[0]);
	}

	private OnScreenClicked(aEvent:MouseTouchEvent):void {

		var element:HTMLElement = <HTMLElement>aEvent.currentTarget;

		if (element.id.indexOf("conference-view-") >= 0) {

			this.OnConferenceToggleClicked(element.id);

		} else if(element.id.indexOf("schedule-btn") >= 0) {

			this.FilterEventByDate(Number(element.id.split("schedule-btn-")[1]));

		} else if(element.id.indexOf("tag-") >= 0) {

			this.FilterEventByType(this.GetSubjectTypeBySlug(element.id.split("tag-")[1]));

		}else if(element.id == "schedule-option") {

			this.ShowOptionMenu();
		}
	}

	private GetSubjectTypeBySlug(aSubjectSlug:string):SubjectType{

		var subjectTypes:Array<SubjectType> = this.mSubjectTypeModel.GetSubjectTypes();

		for(var i:number = 0, max = subjectTypes.length; i < max; i++){

			if(subjectTypes[i].subjectSlug == aSubjectSlug) { return subjectTypes[i]; }
		}

		return null;
	}

	private OnConferenceToggleClicked(aElementId:string):void {

		var conferenceViewId:string = aElementId.split("conference-view-")[1];

		var element:HTMLElement = document.getElementById("conference-toggleElement-" + conferenceViewId);

		var collapsed = "conference-content conference-collapsed";
		var expanded = "conference-content conference-expanded"

		element.className = element.className === collapsed ? expanded : collapsed;
	}
}
