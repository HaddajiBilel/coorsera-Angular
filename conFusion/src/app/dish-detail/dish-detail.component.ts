import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Dish} from '../shared/dish';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comment } from '../shared/comment';
import { visibility, expand } from '../animations/app.animation';

@Component({
  selector: 'app-dish-detail',
  templateUrl: './dish-detail.component.html',
  styleUrls: ['./dish-detail.component.scss'],
  animations: [ 
    visibility(),
    expand() ]
})
export class DishDetailComponent implements OnInit {


  commentForm: FormGroup;
  commentstr: Comment;

  dish: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;
  dishCopy: Dish;
  visibility = 'shown';

  @ViewChild('fform') feedbackFormDirective;

  formErrors = {
    'author': '',
    'comment': ''
  };

  validationMessages = {
    'author': {
      'required':      'Name is required.',
      'minlength':     'Name must be at least 2 characters long.',
      'maxlength':     'Name cannot be more than 15 characters long.'
    },
    'comment': {
      'required':      'Comment is required.',
      'minlength':     'Comment must be at least 10 characters long.'
    },
  };

  

  constructor(private dishservice: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private CForm:FormBuilder,
    @Inject('BaseURL') public BaseURL) {
      this.createForm();

    }

    ngOnInit() {
      this.dishservice.getDishIds()
        .subscribe(dishIds => this.dishIds = dishIds);

      this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishservice.getDish(params['id']); }))
        .subscribe(dish => { this.dish = dish; this.dishCopy = dish; 
          
      this.setPrevNext(dish.id); this.visibility = 'shown'; },
        errmess => this.errMess = <any>errmess);
    }
  
    setPrevNext(dishId: string) {
      const index = this.dishIds.indexOf(dishId);
      this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
      this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
    }
    goBack(): void {
      this.location.back();

    }


    createForm() {
      //this.slider = 4;
      this.commentForm = this.CForm.group({
        author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(15)] ],
        comment: ['', [Validators.required, Validators.minLength(10)] ],
        rating: 4,
      });
    
    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

      this.onValueChanged();
    }
    

    onValueChanged(data?: any) {
      if (!this.commentForm) { return; }
      const form = this.commentForm;
      for (const field in this.formErrors) {
        if (this.formErrors.hasOwnProperty(field)) {
          // clear previous error message (if any)
          this.formErrors[field] = '';
          const control = form.get(field);
          if (control && control.dirty && !control.valid) {
            const messages = this.validationMessages[field];
            for (const key in control.errors) {
              if (control.errors.hasOwnProperty(key)) {
                this.formErrors[field] += messages[key] + ' ';
              }
            }
          }
        }
      }
    };


    onSubmit() {
      this.commentstr = this.commentForm.value;
      console.log(this.commentstr);
      this.commentstr.date = new Date().toString();
      this.dishCopy.comments.push(this.commentstr);
      this.dishservice.putDish(this.dishCopy)
        .subscribe(dish => {
          this.dish = dish;
          this.dishCopy = dish
        },
        errmess => {this.dish = null; this.dishCopy = null; this.errMess=<any>errmess;});
      this.commentForm.reset({
        author: '',
        comment: '',
        rating: 4,
      });
      this.feedbackFormDirective.resetForm();
    };

}
