import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})

export class UploadComponent implements OnInit {
  public imagePath= [{'name':''}];
  imgURL: any;
  public message: string;
  public choosed: boolean = false;
  public labels: any

  downloadURL: Observable<string>;

  @ViewChild('video', { static: false }) video: ElementRef;

  @ViewChild('canvas', { static: false }) public canvas: ElementRef;

  constructor(
    private firestorage: AngularFirestore,
    private storage: AngularFireStorage
  ) { }

  ngOnInit() {
  }

  public ngAfterViewInit() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        this.video.nativeElement.srcObject = stream;
        this.video.nativeElement.play();
      });
    }
  }

  public capture() {
    var context = this.canvas.nativeElement.getContext("2d").drawImage(this.video.nativeElement, 0, 0, 640, 380);
    this.imgURL = this.canvas.nativeElement.toDataURL("image/png");
    console.log(this.imgURL);
    const fileId = (new Date()).getTime() + '';
    const filePath = fileId + ".png";
    let blob = this.dataURItoBlob(this.imgURL);
    let file = new File([blob], "filePath", { type: "image/png", });

    //send to cloud
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    // get notified when the download URL is available
    task.snapshotChanges().pipe(finalize(() => this.downloadURL = fileRef.getDownloadURL())).subscribe();

    // get collection item from file
    let docRef = this.firestorage.collection("photos").doc(filePath);

    docRef.snapshotChanges().subscribe(res => {
      console.log(res);
      console.log(res.payload);
      console.log(res.payload.data());
      if(res.payload.data()!=null){
        this.labels = res.payload.data()['labels'];
      }
    });
  }

  dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    var ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], { type: mimeString });
    return blob;
  }
}