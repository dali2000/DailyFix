import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  tasksCompleted = 1;
  totalTasks = 4;

  upcomingHouseTasks = [
    { name: 'Lessive', date: '(demain)' },
    { name: 'Courses', date: '(vendredi)' },
    { name: 'Ménage salon', date: '(samedi)' },
  ];

  upcomingEvents = [
    { name: 'Dîner avec Marie', date: '(ce soir)' },
    { name: 'Cinéma', date: '(samedi)' },
    { name: 'Anniversaire Paul', date: '(dimanche)' },
  ];

  personalGoals = [
    { name: 'Lire 20 min/jour', done: true },
    { name: 'Méditation', done: false },
    { name: 'Exercice', done: true },
  ];
}
