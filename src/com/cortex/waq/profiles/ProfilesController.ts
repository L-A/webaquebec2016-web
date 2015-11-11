import ComponentData from "../../core/component/data/ComponentData";
import ComponentEvent from "../../core/component/event/ComponentEvent";
import ListComponent from "../../core/component/ListComponent";

import EventDispatcher from "../../core/event/EventDispatcher";

import MouseTouchEvent from "../../core/mouse/event/MouseTouchEvent";

import MVCEvent from "../../core/mvc/event/MVCEvent";
import AbstractView from "../../core/mvc/AbstractView";

import Profile from "./data/Profile"
import ProfilesModel from "./ProfilesModel";

export default class ProfilesController extends EventDispatcher {

	private mProfilesView:AbstractView;
	private mListComponent:ListComponent;

	private mProfilesModel:ProfilesModel;
	private mTotalProfiles:number;

	constructor() {
		super();
		this.Init();
	}

	public Init():void {
		this.mProfilesModel = ProfilesModel.GetInstance(ProfilesModel.PROFILES_SPEAKERS);
		this.mProfilesModel.isDataReady ?
			this.OnDataReady() :
			this.mProfilesModel.AddEventListener(MVCEvent.JSON_LOADED, this.OnJSONParsed, this);
	}

	public Destroy():void {
		var scheduleHTMLElement:HTMLElement = document.getElementById("profiles-view");
		document.getElementById("content-current").removeChild(scheduleHTMLElement);

		this.mProfilesView.RemoveEventListener(MouseTouchEvent.TOUCHED, this.OnScreenClicked, this);

		this.mListComponent.Destroy();
		this.mListComponent = null;

		this.mProfilesView.Destroy();
		this.mProfilesView = null;
	}

	private OnJSONParsed() {
		this.mProfilesModel.RemoveEventListener(MVCEvent.JSON_LOADED, this.OnJSONParsed, this);
		this.OnDataReady();
	}

	private OnDataReady() {
		this.mProfilesView = new AbstractView();
		this.mProfilesView.AddEventListener(MVCEvent.TEMPLATE_LOADED, this.OnTemplateLoaded, this);
		this.mProfilesView.LoadTemplate("templates/profiles/profiles.html");
		this.mListComponent = new ListComponent();
	}

	private OnTemplateLoaded(aEvent:MVCEvent):void {
		document.getElementById("content-loading").innerHTML += this.mProfilesView.RenderTemplate({});
		this.mProfilesView.RemoveEventListener(MVCEvent.TEMPLATE_LOADED, this.OnTemplateLoaded, this);
		this.mProfilesView.AddEventListener(MouseTouchEvent.TOUCHED, this.OnScreenClicked, this);
		this.DispatchEvent(new MVCEvent(MVCEvent.TEMPLATE_LOADED));

		this.mProfilesView.AddClickControl(document.getElementById("profiles-selected-return"));

		this.mListComponent.Init("profiles-grid");
		this.CreateProfileTiles();
	}

	private CreateProfileTiles():void {
		this.mListComponent.AddEventListener(ComponentEvent.ALL_ITEMS_READY, this.AllItemsReady, this);

		var profiles = this.mProfilesModel.GetProfiles();
		this.mTotalProfiles = profiles.length;
		for (var i:number = 0, iMax:number = this.mTotalProfiles; i < iMax; i++) {
			if (i == 8) {
				this.mListComponent.AddComponent(new AbstractView(), "templates/profiles/profileQuote.html", new ComponentData());
			}
			this.mListComponent.AddComponent(new AbstractView(), "templates/profiles/profileTile.html", profiles[i]);
		}
	}

	private AllItemsReady():void {
		this.mListComponent.RemoveEventListener(ComponentEvent.ALL_ITEMS_READY, this.AllItemsReady, this);
		for (var i:number = 0, iMax:number = this.mTotalProfiles + 1; i < iMax; i++) {
			if (i == 8) continue;
			this.mProfilesView.AddClickControl(document.getElementById("profiles-tile-" + i.toString()));
		}
	}

	private OnScreenClicked(aEvent:MouseTouchEvent):void {
		var element:HTMLElement = <HTMLElement>aEvent.currentTarget;

		if (element.id == "profiles-selected-return") {
			this.OnReturnClicked();
		}
		else if (element.id.indexOf("profiles-tile-") >= 0) {
			this.OnTileClicked(element.id);
		}
	}

	private OnReturnClicked() {
		var selectionView:HTMLElement = document.getElementById("profiles-selection");
		selectionView.style.left = "100%";
	}

	private OnTileClicked(aElementId:string):void {
		var tileId:string = aElementId.split("profiles-tile-")[1];
		var profile:Profile = <Profile>this.mListComponent.GetDataByID(tileId);
		this.SetProfileDetails(profile);

		this.HideNoSelectionView();
		this.ShowSelectionView();
		this.ScrollDetailsView();
	}

	private SetProfileDetails(aProfile:Profile):void {
		var elementFullName:HTMLElement = document.getElementById("profiles-details-name");
		var elementSubtitle:HTMLElement = document.getElementById("profiles-details-title");
		var elementPhoto:HTMLElement = document.getElementById("profiles-selected-photo");
		var elementBio:HTMLElement = document.getElementById("profiles-selected-bio");
		var elementFirstName:HTMLElement = document.getElementById("profiles-details-firstName");

		elementFullName.innerHTML = aProfile.firstName + " " + aProfile.lastName;
		if (aProfile.subtitle !== "") {
			elementFullName.innerHTML += ", ";
			elementSubtitle.innerHTML = aProfile.subtitle;
		}

		elementPhoto.style.backgroundImage = "url(img/profiles/photo-" + aProfile.photo + ".jpg)";
		elementBio.innerHTML = aProfile.bio;
		elementFirstName.innerHTML = aProfile.firstName;
	}

	private HideNoSelectionView():void {
		document.getElementById("profiles-selection-none").style.display = "none";
	}

	private ShowSelectionView():void {
		var selectionView:HTMLElement = document.getElementById("profiles-selection");
		selectionView.style.display = "block";
		selectionView.style.left = "0";
	}

	private ScrollDetailsView():void {
		var scrollView:HTMLElement = document.getElementById("profiles-selection-show");
		scrollView.scrollTop = 0;
	}
}
